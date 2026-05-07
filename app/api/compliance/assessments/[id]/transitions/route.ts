import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { VALID_TRANSITIONS, type ComplianceAssessmentStatus, type ActorRole, type GapFlags } from '@/lib/types/compliance-workflow';
import {
  sendAssessmentSubmittedToLawyer,
  sendChangesRequestedToHR,
  sendAssessmentValidatedToHR,
} from '@/lib/email';

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

async function computeAnalysis(
  supabase: ReturnType<typeof supabaseAdmin>,
  orgId: string,
): Promise<{ risk_score: number; gap_flags: GapFlags }> {
  // Run all 4 queries in parallel
  const [
    genderRows,
    missingJustRows,
    outOfRangeRow,
    deptGenderRows,
  ] = await Promise.all([
    // 1. Gender gap — org-level average salaries by gender
    supabase
      .from('employees')
      .select('gender, base_salary')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .not('base_salary', 'is', null)
      .in('gender', ['male', 'female']),

    // 2. Missing justifications — employees with salary but no salary_decisions entry
    supabase
      .from('employees')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .not('base_salary', 'is', null),

    // 3. Bands out of range — employees outside their pay_band limits
    supabase
      .from('employees')
      .select('id, base_salary, pay_bands!inner(min_salary, max_salary)')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .not('base_salary', 'is', null)
      .not('pay_band_id', 'is', null),

    // 4. Department-level gender gap — for high_risk_departments
    supabase
      .from('employees')
      .select('department_id, gender, base_salary')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .not('base_salary', 'is', null)
      .not('department_id', 'is', null)
      .in('gender', ['male', 'female']),
  ]);

  // ── 1. gender_gap_exceeded ──────────────────────────────────────────────────
  const genderData = genderRows.data ?? [];
  const maleSalaries = genderData
    .filter((r) => r.gender === 'male')
    .map((r) => r.base_salary as number);
  const femaleSalaries = genderData
    .filter((r) => r.gender === 'female')
    .map((r) => r.base_salary as number);

  const avgMale =
    maleSalaries.length > 0
      ? maleSalaries.reduce((a, b) => a + b, 0) / maleSalaries.length
      : 0;
  const avgFemale =
    femaleSalaries.length > 0
      ? femaleSalaries.reduce((a, b) => a + b, 0) / femaleSalaries.length
      : 0;

  const gap_pct =
    avgMale > 0 && avgFemale > 0
      ? (Math.abs(avgMale - avgFemale) / Math.max(avgMale, avgFemale)) * 100
      : 0;
  const gender_gap_exceeded = gap_pct > 5;

  // ── 2. missing_justifications ───────────────────────────────────────────────
  const allActiveWithSalary = missingJustRows.data ?? [];
  const employeeIds = allActiveWithSalary.map((e) => e.id as string);

  let employeesWithDecisions = new Set<string>();
  if (employeeIds.length > 0) {
    const { data: decisionRows } = await supabase
      .from('salary_decisions')
      .select('employee_id')
      .eq('organization_id', orgId)
      .in('employee_id', employeeIds);
    employeesWithDecisions = new Set(
      (decisionRows ?? []).map((d) => d.employee_id as string),
    );
  }
  const missing_justifications = employeeIds.filter(
    (id) => !employeesWithDecisions.has(id),
  ).length;

  // ── 3. bands_out_of_range ───────────────────────────────────────────────────
  // Supabase returns joined relations as arrays; cast via unknown to handle that.
  type OutOfRangeRow = {
    id: string;
    base_salary: number;
    pay_bands: { min_salary: number; max_salary: number } | { min_salary: number; max_salary: number }[];
  };
  const outOfRangeData = (outOfRangeRow.data ?? []) as unknown as OutOfRangeRow[];
  const bands_out_of_range = outOfRangeData.filter((e) => {
    const band = Array.isArray(e.pay_bands) ? e.pay_bands[0] : e.pay_bands;
    if (!band) return false;
    return e.base_salary < band.min_salary || e.base_salary > band.max_salary;
  }).length;

  // ── 4. high_risk_departments ────────────────────────────────────────────────
  type DeptRow = { department_id: string; gender: string; base_salary: number };
  const deptData = (deptGenderRows.data ?? []) as DeptRow[];

  const deptAccumulator: Record<string, { male: number[]; female: number[] }> = {};
  for (const row of deptData) {
    if (!deptAccumulator[row.department_id]) {
      deptAccumulator[row.department_id] = { male: [], female: [] };
    }
    if (row.gender === 'male') {
      deptAccumulator[row.department_id].male.push(row.base_salary);
    } else {
      deptAccumulator[row.department_id].female.push(row.base_salary);
    }
  }

  const high_risk_departments: string[] = [];
  for (const [deptId, salaries] of Object.entries(deptAccumulator)) {
    if (salaries.male.length === 0 || salaries.female.length === 0) continue;
    const deptAvgMale = salaries.male.reduce((a, b) => a + b, 0) / salaries.male.length;
    const deptAvgFemale = salaries.female.reduce((a, b) => a + b, 0) / salaries.female.length;
    const deptGap =
      (Math.abs(deptAvgMale - deptAvgFemale) / Math.max(deptAvgMale, deptAvgFemale)) * 100;
    if (deptGap > 5) {
      high_risk_departments.push(deptId);
    }
  }

  // ── 5. risk_score ───────────────────────────────────────────────────────────
  let score = 0;
  if (gender_gap_exceeded) score += 40;
  score += Math.min(30, missing_justifications * 3);
  score += Math.min(30, bands_out_of_range * 2);
  const risk_score = Math.min(100, score);

  const gap_flags: GapFlags = {
    gender_gap_exceeded,
    missing_justifications,
    bands_out_of_range,
    high_risk_departments,
  };

  return { risk_score, gap_flags };
}

async function computeAndStoreAnalysis(
  supabase: ReturnType<typeof supabaseAdmin>,
  assessmentId: string,
  orgId: string,
): Promise<{ risk_score: number | null; gap_flags: GapFlags | null }> {
  try {
    const { risk_score, gap_flags } = await computeAnalysis(supabase, orgId);

    const { error: updateError } = await supabase
      .from('compliance_assessments')
      .update({ risk_score, gap_flags })
      .eq('id', assessmentId)
      .eq('organization_id', orgId);

    if (updateError) {
      console.error('computeAndStoreAnalysis: assessment update error:', updateError);
      return { risk_score: null, gap_flags: null };
    }

    return { risk_score, gap_flags };
  } catch (err: unknown) {
    console.error('computeAndStoreAnalysis: unexpected error:', err);
    return { risk_score: null, gap_flags: null };
  }
}

const transitionSchema = z.object({
  to: z.string(),
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getServerAuthContext();
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = supabaseAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = transitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select('id, status, organization_id, title, initiated_by, lawyer_id')
    .eq('id', id)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (assessmentError) {
    console.error('compliance_assessments select error:', assessmentError);
    return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  }

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  const { data: userRoleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.user!.id)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (roleError) {
    console.error('user_roles select error:', roleError);
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  if (!userRoleRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const currentStatus = assessment.status as ComplianceAssessmentStatus;
  const userRole = userRoleRow.role as ActorRole;
  const toStatus = parsed.data.to as ComplianceAssessmentStatus;

  const validTransitionsForStatus = VALID_TRANSITIONS[currentStatus] ?? [];
  const matchedTransition = validTransitionsForStatus.find((t) => t.to === toStatus);

  if (!matchedTransition) {
    return NextResponse.json(
      { error: `Transition from '${currentStatus}' to '${toStatus}' is not allowed` },
      { status: 422 },
    );
  }

  if (!matchedTransition.allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: `Role '${userRole}' may not trigger this transition` },
      { status: 403 },
    );
  }

  // When transitioning to ANALYZED, compute risk metrics first so they are
  // written in the same UPDATE as the status change.
  let analyzedRiskScore: number | null = null;
  let analyzedGapFlags: GapFlags | null = null;
  if (toStatus === 'ANALYZED') {
    const result = await computeAndStoreAnalysis(supabase, id, context.activeOrganizationId);
    analyzedRiskScore = result.risk_score;
    analyzedGapFlags = result.gap_flags;
  }

  const updatePayload: Record<string, unknown> = { status: toStatus };
  if (toStatus === 'CERTIFIED_SNAPSHOT') {
    updatePayload.expires_at = new Date(
      Date.now() + 12 * 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }
  if (toStatus === 'ANALYZED') {
    updatePayload.risk_score = analyzedRiskScore;
    updatePayload.gap_flags = analyzedGapFlags;
  }

  const { error: updateError } = await supabase
    .from('compliance_assessments')
    .update(updatePayload)
    .eq('id', id);

  if (updateError) {
    console.error('compliance_assessments update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: transition, error: transitionError } = await supabase
    .from('assessment_transitions')
    .insert({
      assessment_id: id,
      from_status: currentStatus,
      to_status: toStatus,
      actor_id: context.user!.id,
      actor_role: userRole,
      note: parsed.data.note ?? null,
    })
    .select()
    .single();

  if (transitionError) {
    console.error('assessment_transitions insert error:', transitionError);
    return NextResponse.json({ error: transitionError.message }, { status: 500 });
  }

  // Fire-and-forget email notifications — never block the response
  const assessmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/compliance-workflow`;
  const assessmentTitle = assessment.title ?? `Compliance-Prüfung ${id.slice(0, 8)}`;

  void (async () => {
    try {
      if (toStatus === 'PENDING_REVIEW' && assessment.lawyer_id) {
        const { data: { user: lawyerUser } } = await supabase.auth.admin.getUserById(assessment.lawyer_id);
        if (lawyerUser?.email) {
          const lawyerName = lawyerUser.user_metadata?.full_name as string | undefined ?? lawyerUser.email;
          const { data: companyRow } = await supabase
            .from('companies')
            .select('name')
            .eq('organization_id', context.activeOrganizationId)
            .maybeSingle();
          await sendAssessmentSubmittedToLawyer(
            lawyerUser.email,
            lawyerName,
            companyRow?.name ?? context.activeOrganizationId,
            assessmentTitle,
            assessmentUrl,
          );
        }
      } else if (toStatus === 'CHANGES_REQUESTED' && assessment.initiated_by) {
        const { data: { user: hrUser } } = await supabase.auth.admin.getUserById(assessment.initiated_by);
        if (hrUser?.email) {
          const hrName = hrUser.user_metadata?.full_name as string | undefined ?? hrUser.email;
          await sendChangesRequestedToHR(
            hrUser.email,
            hrName,
            assessmentTitle,
            parsed.data.note ?? '',
            assessmentUrl,
          );
        }
      } else if (toStatus === 'VALIDATED' && assessment.initiated_by) {
        const { data: { user: hrUser } } = await supabase.auth.admin.getUserById(assessment.initiated_by);
        if (hrUser?.email) {
          const hrName = hrUser.user_metadata?.full_name as string | undefined ?? hrUser.email;
          await sendAssessmentValidatedToHR(
            hrUser.email,
            hrName,
            assessmentTitle,
            assessmentUrl,
          );
        }
      }
    } catch (emailErr) {
      console.error('compliance transition email notification failed:', emailErr);
    }
  })();

  return NextResponse.json({ transition }, { status: 201 });
}
