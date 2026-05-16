import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole, pickFields, getCompanyId, EMPLOYEE_WRITE_FIELDS } from '@/lib/auth/api-guard';
import { logAuditEntry } from '@/lib/audit-log';
import { humanizePgError } from '@/lib/pg-error';
import { getEffectiveTier, getPlanLimits, type SubscriptionStatus, type SubscriptionTier } from '@/lib/subscription';

// Per-row validation schema for bulk import.
// Required fields match DB NOT NULL constraints and compliance data quality requirements.
const bulkEmployeeRowSchema = z.object({
  first_name: z.string().min(1, 'first_name darf nicht leer sein'),
  last_name: z.string().min(1, 'last_name darf nicht leer sein'),
  gender: z.enum(['male', 'female', 'diverse', 'not_specified'], {
    errorMap: () => ({ message: 'gender muss male, female, diverse oder not_specified sein' }),
  }),
  base_salary: z.number({ invalid_type_error: 'base_salary muss eine Zahl sein' }).positive('base_salary muss positiv sein'),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'hire_date muss im Format YYYY-MM-DD sein'),
}).passthrough();

/**
 * POST /api/employees/bulk  — atomic CSV import (Risk #3 + Risk #4).
 *
 * Replaces the client's row-by-row POST loop. The old path made N HTTP
 * round-trips, each a single-row INSERT that fired the pay_gap snapshot
 * trigger — O(n²) — and was non-atomic: a timeout at row K left K employees
 * imported and the rest dropped, silently corrupting the compliance dataset.
 *
 * This endpoint:
 *   - validates the whole batch and the plan limit UP FRONT (all-or-nothing —
 *     a partial compliance import is unsafe, so we reject rather than
 *     half-import),
 *   - performs ONE multi-row INSERT (a single statement = atomic, and fires
 *     the now statement-level snapshot trigger exactly once),
 *   - writes ONE bulk audit entry instead of N hash-chained ones.
 *
 * Same auth (guardRole), same field allowlist (pickFields), same plan-limit
 * semantics as POST /api/employees — just batched.
 */

// Defensive upper bound on a single request (Enterprise is "unlimited" but a
// single import of >5000 is operationally abnormal and an abuse vector).
const MAX_BATCH = 5000;

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const rows = (body as { employees?: unknown })?.employees;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Keine Mitarbeiterdaten übermittelt' }, { status: 400 });
  }
  if (rows.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Maximal ${MAX_BATCH} Mitarbeiter pro Import. Bitte in mehreren Dateien aufteilen.` },
      { status: 413 },
    );
  }
  if (!rows.every((r) => r !== null && typeof r === 'object' && !Array.isArray(r))) {
    return NextResponse.json({ error: 'Ungültiges Zeilenformat' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const companyId = await getCompanyId(orgId, supabase);
  if (!companyId) {
    return NextResponse.json({ error: 'Keine Firma für diese Organisation gefunden' }, { status: 400 });
  }

  // ── Plan-limit check up front: the WHOLE batch must fit, atomically ───────
  const { data: company } = await supabase
    .from('companies')
    .select('subscription_tier, subscription_status, trial_ends_at')
    .eq('id', companyId)
    .maybeSingle();
  const effectiveTier = getEffectiveTier(
    (company?.subscription_tier as SubscriptionTier | null) ?? 'basis',
    (company?.subscription_status as SubscriptionStatus | null) ?? 'canceled',
    company?.trial_ends_at ?? null,
  );
  const limits = getPlanLimits(effectiveTier);

  if (limits.maxEmployees !== -1) {
    const { count, error: countError } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (countError) {
      console.error('employees bulk count error:', countError);
      return NextResponse.json({ error: 'Fehler beim Prüfen des Mitarbeiterlimits' }, { status: 500 });
    }

    const current = count ?? 0;
    const remaining = Math.max(0, limits.maxEmployees - current);
    if (rows.length > remaining) {
      return NextResponse.json(
        {
          error: `Plan-Limit: ${remaining} von ${rows.length} Mitarbeitern würden noch passen `
            + `(aktuell ${current}/${limits.maxEmployees}). Import abgebrochen — bitte Plan upgraden `
            + `oder Datei kürzen. Es wurde nichts importiert.`,
          remaining,
          requested: rows.length,
          current,
          limit: limits.maxEmployees,
        },
        { status: 402 },
      );
    }
  }

  // ── Per-row Zod validation (required fields) ─────────────────────────────
  // Runs after plan-limit check so we don't waste DB round-trips on bad data.
  for (let i = 0; i < rows.length; i++) {
    const result = bulkEmployeeRowSchema.safeParse(rows[i]);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const field = firstIssue?.path.join('.') ?? 'unbekanntes Feld';
      const detail = firstIssue?.message ?? 'Ungültiger Wert';
      return NextResponse.json(
        { error: `Zeile ${i + 1}: ${field} — ${detail}` },
        { status: 400 },
      );
    }
  }

  // ── Single atomic multi-row INSERT ───────────────────────────────────────
  // pickFields per row = same mass-assignment protection as the single route.
  const toInsert = rows.map((r) => ({
    ...pickFields(r as Record<string, unknown>, EMPLOYEE_WRITE_FIELDS),
    organization_id: orgId,
    company_id: companyId,
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from('employees')
    .insert(toInsert)
    .select('id');

  if (error) {
    // One bad row fails the whole statement — nothing is imported. That is the
    // intended all-or-nothing behaviour for compliance data.
    console.error('employees bulk POST error:', { code: error.code, message: error.message, details: error.details });
    const humanized = humanizePgError(error, 'Mitarbeiter');
    return NextResponse.json(
      { error: `${humanized.message} — kein Mitarbeiter wurde importiert (atomarer Import).` },
      { status: humanized.status },
    );
  }

  const insertedIds = (data ?? []).map((d) => d.id as string);

  // One bulk audit entry — avoids N hash-chained audit_logs writes.
  void logAuditEntry(supabase, {
    orgId,
    companyId,
    userId,
    action: 'create',
    entityType: 'employees',
    entityId: insertedIds[0] ?? 'bulk',
    afterState: { bulk_import: true, count: insertedIds.length, employee_ids: insertedIds },
  });

  return NextResponse.json(
    { success: true, count: insertedIds.length, ids: insertedIds },
    { status: 201 },
  );
}
