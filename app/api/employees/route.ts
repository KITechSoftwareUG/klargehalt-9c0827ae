import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole, pickFields, getCompanyId, EMPLOYEE_WRITE_FIELDS } from '@/lib/auth/api-guard';
import { logAuditEntry } from '@/lib/audit-log';

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('employees')
    .select('id, organization_id, employee_number, first_name, last_name, email, gender, birth_year, job_profile_id, job_level_id, department_id, employment_type, location, hire_date, base_salary, variable_pay, weekly_hours, currency, pay_band_id, on_leave, leave_type, leave_start, leave_end, user_id, is_active, created_by, created_at, updated_at, salary_justification, salary_justification_updated_at, salary_justification_updated_by')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('last_name');

  if (error) {
    console.error('employees GET error:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, EMPLOYEE_WRITE_FIELDS);
  const supabase = createServiceClient();

  const companyId = await getCompanyId(orgId, supabase);
  if (!companyId) {
    return NextResponse.json({ error: 'Keine Firma für diese Organisation gefunden' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({ ...safeBody, organization_id: orgId, company_id: companyId, created_by: userId })
    .select()
    .single();

  if (error) {
    console.error('employees POST error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }

  void logAuditEntry(supabase, {
    orgId,
    companyId,
    userId,
    action: 'create',
    entityType: 'employees',
    entityId: data.id,
    afterState: data,
  });

  return NextResponse.json(data, { status: 201 });
}
