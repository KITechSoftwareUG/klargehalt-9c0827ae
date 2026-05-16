import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAuditEntry } from '@/lib/audit-log';
import { getLogtoUserEmail, tearDownLogtoForOrg } from '@/lib/logto-management';
import { sendAccountAnonymizedEmail } from '@/lib/email';

/**
 * GET /api/cron/account-cleanup — daily Coolify cron (x-cron-secret).
 *
 * Finalizes tenants whose 30-day grace window elapsed: pseudonymize PII +
 * hard-delete operational data via anonymize_organization() (DB function,
 * idempotent + guarded), write the DSGVO Art. 17 deletion record into the
 * retained audit trail, then tear down Logto. Per-org isolation: one failure
 * never blocks the rest.
 */
const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

interface DueCompany {
  id: string;
  name: string | null;
  organization_id: string;
  deletion_requested_by: string | null;
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron] CRON_SECRET not configured — rejecting all requests');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const incoming = request.headers.get('x-cron-secret') ?? '';
  const a = Buffer.from(incoming);
  const b = Buffer.from(expected);
  if (!(a.length === b.length && timingSafeEqual(a, b))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: due, error: queryError } = await supabase
    .from('companies')
    .select('id, name, organization_id, deletion_requested_by')
    .eq('deletion_status', 'deletion_scheduled')
    .lte('deletion_scheduled_at', new Date().toISOString());

  if (queryError) {
    console.error('[account-cleanup] query failed:', queryError.message);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  const companies = (due ?? []) as DueCompany[];
  let processed = 0;
  const errors: string[] = [];

  for (const company of companies) {
    const orgId = company.organization_id;
    const originalName = company.name ?? 'Unternehmen';
    try {
      // Capture the owner email BEFORE anonymization/teardown nulls/removes it.
      const ownerEmail = company.deletion_requested_by
        ? await getLogtoUserEmail(company.deletion_requested_by)
        : null;

      const { error: rpcError } = await supabase.rpc('anonymize_organization', {
        p_org_id: orgId,
      });
      if (rpcError) {
        throw new Error(`anonymize_organization: ${rpcError.message}`);
      }

      // DSGVO Art. 17 deletion record — written into the retained, frozen
      // audit trail (the companies row still exists, pseudonymized).
      await logAuditEntry(supabase, {
        orgId,
        companyId: company.id,
        userId: 'system:account-cleanup',
        userEmail: null,
        userRole: 'system',
        action: 'delete',
        entityType: 'company',
        entityId: company.id,
        entityName: originalName,
        metadata: { kind: 'account_anonymized', anonymized_at: new Date().toISOString() },
      });

      // Irreversible Logto teardown last (DB state is the source of truth).
      await tearDownLogtoForOrg(orgId);

      if (ownerEmail) {
        try {
          await sendAccountAnonymizedEmail(ownerEmail, originalName);
        } catch {
          console.error('[account-cleanup] final email failed (non-fatal):', orgId);
        }
      }

      processed += 1;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[account-cleanup] org failed:', orgId, message);
      errors.push(orgId);
    }
  }

  return NextResponse.json({
    success: true,
    due: companies.length,
    processed,
    failed: errors.length,
  });
}
