import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

const createCommentSchema = z.object({
  section: z.enum(['pay_bands', 'gap_analysis', 'job_profiles', 'salary_decisions', 'general']),
  severity: z.enum(['INFO', 'WARNING', 'BLOCKER']),
  comment_text: z.string().min(5),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager', 'lawyer']);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select('id')
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

  const { data, error } = await supabase
    .from('legal_review_comments')
    .select('*')
    .eq('assessment_id', id)
    .eq('organization_id', guard.orgId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('legal_review_comments select error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['lawyer']);
  if (guard instanceof NextResponse) return guard;

  const supabase = supabaseAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { id } = await params;

  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select('id')
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

  const { data, error } = await supabase
    .from('legal_review_comments')
    .insert({
      ...parsed.data,
      assessment_id: id,
      organization_id: guard.orgId,
      lawyer_id: guard.userId,
    })
    .select()
    .single();

  if (error) {
    console.error('legal_review_comments insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
