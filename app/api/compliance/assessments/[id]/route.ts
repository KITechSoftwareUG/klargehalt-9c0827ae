import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getServerAuthContext();
  // Tenant-isolation gate (Risk #1): the assessment + its transitions/comments/
  // snapshot were previously reachable by spoofing kg_active_org to a victim
  // org. Validate active membership before any service-role read.
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: assessment, error: assessmentError } = await supabase
    .from('compliance_assessments')
    .select('*')
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

  const [
    { data: transitions, error: transitionsError },
    { data: comments, error: commentsError },
    { data: snapshot, error: snapshotError },
  ] = await Promise.all([
    supabase
      .from('assessment_transitions')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('legal_review_comments')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('certified_snapshots')
      .select('*')
      .eq('assessment_id', id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (transitionsError) {
    console.error('assessment_transitions select error:', transitionsError);
    return NextResponse.json({ error: transitionsError.message }, { status: 500 });
  }

  if (commentsError) {
    console.error('legal_review_comments select error:', commentsError);
    return NextResponse.json({ error: commentsError.message }, { status: 500 });
  }

  if (snapshotError) {
    console.error('certified_snapshots select error:', snapshotError);
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...assessment,
      transitions: transitions ?? [],
      comments: comments ?? [],
      snapshot: snapshot ?? null,
    },
  });
}
