import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { inviteEmployeeToOrg } from '@/lib/logto-management';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmployeeInviteEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins/HR can invite employees
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleRow } = await (supabase as any)
    .from('organization_members')
    .select('role')
    .eq('user_id', context.user?.id)
    .eq('organization_id', context.activeOrganizationId)
    .eq('status', 'active')
    .maybeSingle();

  if (!roleRow || !['owner', 'admin', 'hr_manager'].includes(roleRow.role)) {
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

  // Fetch employee record (RLS-scoped via the user's client)
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

  // Look up company name for the email out-of-band
  const admin = createServiceClient();
  const { data: company } = await admin
    .from('companies')
    .select('name')
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();
  const companyName = (company?.name as string) || 'Ihre Organisation';

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

    // Deliver credentials out-of-band — never return tempPassword in JSON.
    try {
      await sendEmployeeInviteEmail(employee.email, employee.first_name, companyName, result.tempPassword);
    } catch (emailError) {
      console.error('Failed to send employee invite email', { employeeId, error: emailError });
      return NextResponse.json(
        { error: 'Mitarbeiter angelegt, aber Einladungs-E-Mail konnte nicht gesendet werden. Bitte Support kontaktieren.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyExists: result.alreadyExists,
      email: employee.email,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Einladung fehlgeschlagen';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
