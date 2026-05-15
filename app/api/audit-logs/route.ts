import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

// Audit logs are readable by admins (owner→admin) and the org lawyer — mirrors
// the <RoleGuard roles={['admin','lawyer']}> gate on the /audit page.
const ALLOWED_ROLES = ['admin', 'lawyer'] as const;

const querySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
  full: z.enum(['0', '1']).default('0'),
  action: z.string().trim().min(1).max(64).optional(),
  entity_type: z.string().trim().min(1).max(64).optional(),
  user_id: z.string().trim().min(1).max(128).optional(),
  // CSV lists used by the export path
  actions: z.string().trim().min(1).max(512).optional(),
  entity_types: z.string().trim().min(1).max(512).optional(),
  // Accept both date-only (YYYY-MM-DD from <input type="date">) and full ISO
  // timestamps. Postgres parses both for created_at comparisons.
  dateFrom: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}([T ].*)?$/).optional(),
  dateTo: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}([T ].*)?$/).optional(),
});

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, [...ALLOWED_ROLES]);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrageparameter' }, { status: 400 });
  }
  const q = parsed.data;

  const supabase = createServiceClient();
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (q.action) query = query.eq('action', q.action);
  if (q.entity_type) query = query.eq('entity_type', q.entity_type);
  if (q.user_id) query = query.eq('user_id', q.user_id);
  if (q.actions) query = query.in('action', q.actions.split(',').filter(Boolean));
  if (q.entity_types) query = query.in('entity_type', q.entity_types.split(',').filter(Boolean));
  if (q.dateFrom) query = query.gte('created_at', q.dateFrom);
  if (q.dateTo) query = query.lte('created_at', q.dateTo);

  // full=1 → entire (filtered) trail for export; otherwise a single page.
  if (q.full === '0') {
    query = query.range(q.page * q.pageSize, (q.page + 1) * q.pageSize - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('audit-logs GET error:', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}
