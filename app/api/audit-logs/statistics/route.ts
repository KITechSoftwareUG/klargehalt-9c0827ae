import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

// Same access gate as the /audit page.
const ALLOWED_ROLES = ['admin', 'lawyer'] as const;

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parsed.data.days);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, entity_type, user_id, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('audit-logs statistics error:', {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  const logs = (data ?? []) as Array<{
    action: string;
    entity_type: string;
    user_id: string;
    created_at: string;
  }>;

  const records_by_action: Record<string, number> = {};
  const records_by_entity: Record<string, number> = {};
  const records_by_user: Record<string, number> = {};
  const daily_map: Record<string, number> = {};

  for (const log of logs) {
    records_by_action[log.action] = (records_by_action[log.action] || 0) + 1;
    records_by_entity[log.entity_type] = (records_by_entity[log.entity_type] || 0) + 1;
    records_by_user[log.user_id] = (records_by_user[log.user_id] || 0) + 1;
    const day = log.created_at.split('T')[0];
    daily_map[day] = (daily_map[day] || 0) + 1;
  }

  const top_users = Object.fromEntries(
    Object.entries(records_by_user)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );

  const daily_activity = Object.entries(daily_map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    total_records: logs.length,
    records_by_action,
    records_by_entity,
    records_by_user,
    top_users,
    daily_activity,
  });
}
