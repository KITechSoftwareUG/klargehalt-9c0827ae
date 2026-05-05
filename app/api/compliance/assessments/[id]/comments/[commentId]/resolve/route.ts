import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const supabase = supabaseAdmin();

  const { id, commentId } = await params;

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

  const { data: comment, error } = await supabase
    .from('legal_review_comments')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('assessment_id', id)
    .eq('organization_id', guard.orgId)
    .select()
    .single();

  if (error) {
    console.error('legal_review_comments update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ comment });
}
