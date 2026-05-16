import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember, guardRole } from '@/lib/auth/api-guard';

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

const createAssessmentSchema = z.object({
  title: z.string().min(3),
  period_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lawyer_id: z.string().optional(),
});

export async function GET() {
  const context = await getServerAuthContext();
  // Tenant-isolation gate (Risk #1): membership-validate before service-role read.
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('organization_id', guard.orgId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('compliance_assessments select error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  // Tenant-isolation + RBAC gate (Risk #1 + Risk #2): guardRole validates
  // active membership AND role against organization_members — the RBAC source
  // of truth — replacing the legacy user_roles lookup that also trusted the
  // unverified cookie org.
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const supabase = supabaseAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { data: assessment, error: insertError } = await supabase
    .from('compliance_assessments')
    .insert({
      ...parsed.data,
      organization_id: guard.orgId,
      initiated_by: guard.userId,
      status: 'DRAFT',
    })
    .select()
    .single();

  if (insertError) {
    console.error('compliance_assessments insert error:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: transitionError } = await supabase
    .from('assessment_transitions')
    .insert({
      assessment_id: assessment.id,
      from_status: 'DRAFT',
      to_status: 'DRAFT',
      actor_role: 'system',
      note: 'Assessment erstellt',
    });

  if (transitionError) {
    console.error('assessment_transitions insert error:', transitionError);
  }

  return NextResponse.json({ success: true, data: assessment }, { status: 201 });
}
