import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getServerAuthContext } from '@/lib/auth/server';

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
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.user!.id)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (!userRole || !['admin', 'hr_manager'].includes(userRole.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, commentId } = await params;

  const { data: comment, error } = await supabase
    .from('legal_review_comments')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('assessment_id', id)
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
