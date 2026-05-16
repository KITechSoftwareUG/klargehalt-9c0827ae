import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { CONTRACT_VERSION, REQUIRED_DOCUMENTS, checkContractsAccepted } from '@/lib/contracts';

export async function GET() {
  try {
    const context = await getServerAuthContext();
    const guard = await guardRole(context, ['admin']);
    if (guard instanceof NextResponse) return guard;

    const supabase = createServiceClient();
    const accepted = await checkContractsAccepted(guard.orgId, supabase);

    return NextResponse.json({
      required: !accepted,
      version: CONTRACT_VERSION,
      documents: REQUIRED_DOCUMENTS,
    });
  } catch (error) {
    console.error('Contracts required: unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
