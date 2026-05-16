import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { sendCertificateIssuedToHR } from '@/lib/email';

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

const certifySchema = z.object({
  lawyer_statement: z.string().min(20),
  valid_months: z.number().int().min(1).max(36).default(12),
});

const getDisplayName = (user: NonNullable<Awaited<ReturnType<typeof getServerAuthContext>>['user']>) =>
  user.fullName || user.firstName || user.email || 'Externer Rechtsberater';

const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.klargehalt.de';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getServerAuthContext();
  // Tenant-isolation + RBAC gate (Risk #1): validates active 'lawyer'
  // membership against organization_members (RBAC source of truth) instead of
  // the legacy user_roles table, before any service-role read.
  const guard = await guardRole(context, ['lawyer']);
  if (guard instanceof NextResponse) return guard;

  const supabase = supabaseAdmin();

  const { id } = await params;

  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select('id, status, organization_id, title, initiated_by, period_from, period_to')
    .eq('id', id)
    .eq('organization_id', guard.orgId)
    .maybeSingle();

  if (assessmentError) {
    console.error('compliance_assessments select error:', assessmentError);
    return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  }

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  if (assessment.status !== 'VALIDATED') {
    return NextResponse.json(
      { error: `Assessment must be in 'VALIDATED' status to certify (current: '${assessment.status}')` },
      { status: 422 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = certifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { lawyer_statement, valid_months } = parsed.data;
  const orgId = guard.orgId;

  const [
    { count: employeesCount, error: empError },
    { count: decisionsCount, error: decError },
    { data: payBands, error: bandsError },
    { data: jobProfiles, error: profilesError },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('salary_decisions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('pay_bands')
      .select('*')
      .eq('organization_id', orgId),
    supabase
      .from('job_profiles')
      .select('*')
      .eq('organization_id', orgId),
  ]);

  if (empError) {
    console.error('employees count error:', empError);
    return NextResponse.json({ error: empError.message }, { status: 500 });
  }
  if (decError) {
    console.error('salary_decisions count error:', decError);
    return NextResponse.json({ error: decError.message }, { status: 500 });
  }
  if (bandsError) {
    console.error('pay_bands select error:', bandsError);
    return NextResponse.json({ error: bandsError.message }, { status: 500 });
  }
  if (profilesError) {
    console.error('job_profiles select error:', profilesError);
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const snapshotTakenAt = new Date().toISOString();
  const validUntil = new Date(
    Date.now() + valid_months * 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: snapshot, error: snapshotError } = await supabase
    .from('certified_snapshots')
    .insert({
      assessment_id: id,
      organization_id: orgId,
      lawyer_id: context.user!.id,
      valid_until: validUntil,
      snapshot_data: {
        employees_count: employeesCount ?? 0,
        salary_decisions_count: decisionsCount ?? 0,
        pay_bands: payBands ?? [],
        job_profiles: jobProfiles ?? [],
        snapshot_taken_at: snapshotTakenAt,
      },
      lawyer_statement,
    })
    .select()
    .single();

  if (snapshotError) {
    console.error('certified_snapshots insert error:', snapshotError);
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  const snapshotUrl = `${getAppUrl()}/compliance-workflow/certificate/${snapshot.id}`;
  const { error: reviewError } = await supabase
    .from('lawyer_reviews')
    .insert({
      organization_id: orgId,
      reviewed_by: context.user!.id,
      reviewed_by_name: getDisplayName(context.user!),
      scope_type: 'pay_gap_report',
      scope_id: snapshot.id,
      scope_label: assessment.title ?? 'Pay-Gap-Bericht',
      verdict: 'approved',
      notes: lawyer_statement,
      recommendations: `Zertifizierter Snapshot: ${snapshotUrl}`,
      document_hash: snapshot.id,
      review_period_start: assessment.period_from,
      review_period_end: assessment.period_to,
    });

  if (reviewError) {
    console.error('lawyer_reviews insert error:', reviewError);
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('compliance_assessments')
    .update({ status: 'CERTIFIED_SNAPSHOT', expires_at: validUntil })
    .eq('id', id);

  if (updateError) {
    console.error('compliance_assessments update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: transitionError } = await supabase
    .from('assessment_transitions')
    .insert({
      assessment_id: id,
      from_status: 'VALIDATED',
      to_status: 'CERTIFIED_SNAPSHOT',
      actor_id: context.user!.id,
      actor_role: 'lawyer',
      note: 'Zertifiziert',
    });

  if (transitionError) {
    console.error('assessment_transitions insert error:', transitionError);
  }

  // Fire-and-forget certificate notification — never block the response
  const assessmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/compliance-workflow`;
  const assessmentTitle = assessment.title ?? `Compliance-Prüfung ${id.slice(0, 8)}`;

  void (async () => {
    try {
      if (assessment.initiated_by) {
        const { data: { user: hrUser } } = await supabase.auth.admin.getUserById(assessment.initiated_by);
        if (hrUser?.email) {
          const hrName = hrUser.user_metadata?.full_name as string | undefined ?? hrUser.email;
          const { data: companyRow } = await supabase
            .from('companies')
            .select('name')
            .eq('organization_id', orgId)
            .maybeSingle();
          await sendCertificateIssuedToHR(
            hrUser.email,
            hrName,
            companyRow?.name ?? orgId,
            assessmentTitle,
            validUntil,
            assessmentUrl,
          );
        }
      }
    } catch (emailErr) {
      console.error('compliance certify email notification failed:', emailErr);
    }
  })();

  return NextResponse.json({ success: true, data: snapshot }, { status: 201 });
}
