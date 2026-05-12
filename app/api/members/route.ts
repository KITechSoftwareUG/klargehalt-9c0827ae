import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';

interface MemberRow {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'hr_manager' | 'employee' | 'lawyer' | 'auditor';
  status: 'active' | 'invited' | 'suspended' | 'removed';
  invited_by_user_id: string | null;
  joined_at: string | null;
  access_expires_at: string | null;
  created_at: string;
}

interface PlanRow {
  id: string;
  max_admin_seats: number;
  max_hr_seats: number;
}

interface CompanyRow {
  subscription_tier: string | null;
}

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const supabase = createServiceClient();

  const [membersRes, companyRes] = await Promise.all([
    supabase
      .from('organization_members')
      .select('id, user_id, role, status, invited_by_user_id, joined_at, access_expires_at, created_at')
      .eq('organization_id', guard.orgId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true }),
    supabase
      .from('companies')
      .select('subscription_tier')
      .eq('organization_id', guard.orgId)
      .maybeSingle(),
  ]);

  if (membersRes.error) {
    return NextResponse.json({ error: membersRes.error.message }, { status: 500 });
  }

  const members = (membersRes.data ?? []) as MemberRow[];
  const company = companyRes.data as CompanyRow | null;
  const planId = company?.subscription_tier ?? 'basis';

  const { data: planData } = await supabase
    .from('plans')
    .select('id, max_admin_seats, max_hr_seats')
    .eq('id', planId)
    .maybeSingle();

  const plan = (planData ?? null) as PlanRow | null;
  const adminUsed = members.filter((m) => m.status === 'active' && (m.role === 'owner' || m.role === 'admin')).length;
  const hrUsed = members.filter((m) => m.status === 'active' && m.role === 'hr_manager').length;

  return NextResponse.json({
    members,
    seatUsage: {
      planId,
      adminUsed,
      adminLimit: plan?.max_admin_seats ?? 1,
      hrUsed,
      hrLimit: plan?.max_hr_seats ?? 1,
    },
  });
}
