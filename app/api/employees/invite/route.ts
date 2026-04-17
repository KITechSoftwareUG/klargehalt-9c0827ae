import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { inviteEmployeeToOrg } from '@/lib/logto-management';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can invite employees
  const supabase = await createClient();
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.user?.id)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (!roleRow || !['admin', 'hr_manager'].includes(roleRow.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rateLimitKey = `employee-invite:${context.activeOrganizationId}`;
  if (!(await checkRateLimit(rateLimitKey, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { employeeId } = (await request.json().catch(() => ({}))) as { employeeId?: string };
  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
  }

  // Fetch employee record
  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, user_id')
    .eq('id', employeeId)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  if (!employee.email) {
    return NextResponse.json({ error: 'Mitarbeiter hat keine E-Mail-Adresse hinterlegt.' }, { status: 400 });
  }

  try {
    const result = await inviteEmployeeToOrg({
      email: employee.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      orgId: context.activeOrganizationId,
    });

    // Link Logto user_id to employee record
    await supabase
      .from('employees')
      .update({ user_id: result.logtoUserId })
      .eq('id', employee.id);

    return NextResponse.json({
      success: true,
      alreadyExists: result.alreadyExists,
      email: employee.email,
      tempPassword: result.tempPassword,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Einladung fehlgeschlagen';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
