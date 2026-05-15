import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerAuthContext } from '@/lib/auth/server';
import { getStripe } from '@/lib/stripe';
import { detectDiscrepancies, applyReconciliation } from '@/lib/stripe-reconcile';
import { isSuperAdminUserId } from '@/lib/auth/super-admin';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function guardSuperAdmin() {
  const auth = await getServerAuthContext();
  if (!isSuperAdminUserId(auth?.user?.id)) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const, userId: auth!.user!.id };
}

export async function GET(_request: NextRequest) {
  const guard = await guardSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const summary = await detectDiscrepancies(supabaseAdmin(), getStripe());
    return NextResponse.json({ checkedAt: new Date().toISOString(), ...summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reconcile failed' },
      { status: 500 },
    );
  }
}

export async function POST(_request: NextRequest) {
  const guard = await guardSuperAdmin();
  if (!guard.ok) return guard.response;

  try {
    const summary = await applyReconciliation(supabaseAdmin(), getStripe(), guard.userId);
    return NextResponse.json({ repairedAt: new Date().toISOString(), ...summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reconcile failed' },
      { status: 500 },
    );
  }
}
