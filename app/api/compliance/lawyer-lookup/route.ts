import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getServerAuthContext } from '@/lib/auth/server';

export type LawyerEntry = {
  id: string;
  email: string;
  name: string;
};

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

function resolveName(
  user: SupabaseAuthUser,
  fallbackEmail: string,
): string {
  const meta = user.user_metadata ?? {};
  const name = meta['name'] ?? meta['full_name'];
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim();
  }
  return fallbackEmail.split('@')[0];
}

export async function GET(): Promise<NextResponse> {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerRole } = await (supabase as any)
    .from('organization_members')
    .select('role')
    .eq('user_id', context.user!.id)
    .eq('organization_id', context.activeOrganizationId)
    .eq('status', 'active')
    .maybeSingle();

  if (!callerRole || !['owner', 'admin', 'hr_manager'].includes(callerRole.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lawyerRows, error: rolesError } = await (supabase as any)
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', context.activeOrganizationId)
    .eq('status', 'active')
    .eq('role', 'lawyer');

  if (rolesError) {
    console.error('lawyer-lookup: failed to query organization_members:', rolesError.message);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  if (!lawyerRows || lawyerRows.length === 0) {
    return NextResponse.json({ lawyers: [] });
  }

  const lawyers: LawyerEntry[] = [];

  await Promise.all(
    lawyerRows.map(async (row: { user_id: string }) => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(row.user_id);

        if (error || !data.user) {
          console.error(
            `lawyer-lookup: getUserById failed for ${row.user_id}:`,
            error?.message ?? 'no user returned',
          );
          return;
        }

        const authUser = data.user as SupabaseAuthUser;
        const email = authUser.email ?? '';

        lawyers.push({
          id: row.user_id,
          email,
          name: resolveName(authUser, email || row.user_id),
        });
      } catch (err) {
        console.error(
          `lawyer-lookup: unexpected error for ${row.user_id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }),
  );

  lawyers.sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return NextResponse.json({ lawyers });
}
