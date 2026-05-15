import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

// Same access gate as the /audit page.
const ALLOWED_ROLES = ['admin', 'lawyer'] as const;

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, [...ALLOWED_ROLES]);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('verify_audit_chain', {
    _org_id: orgId,
  });

  if (error) {
    console.error('audit-logs verify-chain error:', {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json({ error: 'Integritätsprüfung fehlgeschlagen' }, { status: 500 });
  }

  return NextResponse.json({ valid: data as boolean });
}
