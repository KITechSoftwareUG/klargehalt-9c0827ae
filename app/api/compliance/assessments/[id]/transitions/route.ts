import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { VALID_TRANSITIONS, type ComplianceAssessmentStatus, type ActorRole } from '@/lib/types/compliance-workflow';
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

  const updatePayload: Record<string, unknown> = { status: toStatus };
  if (toStatus === 'CERTIFIED_SNAPSHOT') {
    updatePayload.expires_at = new Date(
      Date.now() + 12 * 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
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
