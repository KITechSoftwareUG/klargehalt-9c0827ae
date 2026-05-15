import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { inviteMemberToOrg } from '@/lib/logto-management';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendMemberInviteEmail } from '@/lib/email';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'hr_manager']),
});

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  // owner is treated as admin by guardRole — see lib/auth/api-guard.ts
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  if (!(await checkRateLimit(`member-invite:${guard.orgId}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Zu viele Einladungen — bitte später erneut versuchen.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe — Email und Rolle (admin oder hr_manager) erforderlich.' },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;
  const supabase = createServiceClient();

  // Reject if email is already an active member of this org
  // We need to look up the existing Logto user (if any) to check membership
  const { data: existingUser } = await supabase
    .from('organization_members')
    .select('id, role, status, user_id')
    .eq('organization_id', guard.orgId)
    .eq('status', 'active');

  // Note: we can't check by email here without joining Logto data.
  // The Logto invite call below is idempotent — duplicate adds are absorbed.
  // The org_members INSERT below will fail on UNIQUE (organization_id, user_id)
  // if the user is already a member, which we map to a friendly error.

  let inviteResult: Awaited<ReturnType<typeof inviteMemberToOrg>>;
  try {
    inviteResult = await inviteMemberToOrg({
      email,
      role,
      orgId: guard.orgId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Einladung fehlgeschlagen';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Check if this Logto user is already an active member of this org
  const alreadyMember = existingUser?.some((m) => m.user_id === inviteResult.logtoUserId);
  if (alreadyMember) {
    return NextResponse.json(
      { error: 'Diese Person ist bereits Mitglied der Organisation.' },
      { status: 409 }
    );
  }

  // Upsert membership row. Trigger enforces seat limits and raises on overflow.
  const { error: insertError } = await supabase
    .from('organization_members')
    .upsert(
      {
        organization_id: guard.orgId,
        user_id: inviteResult.logtoUserId,
        role,
        status: 'active',
        invited_by_user_id: guard.userId,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' }
    );

  if (insertError) {
    // Trigger raises with ERRCODE 'insufficient_privilege' (mapped to 42501)
    // when seat limits are exceeded. Surface a friendly message.
    const friendly = insertError.message.includes('seat limit')
      ? insertError.message
      : `Mitgliedschaft konnte nicht gespeichert werden: ${insertError.message}`;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  // Mirror to legacy user_roles for backward compat (will be dropped post-MVP)
  try {
    await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: inviteResult.logtoUserId,
          organization_id: guard.orgId,
          role,
        },
        { onConflict: 'user_id,organization_id' }
      );
  } catch {
    // legacy table mirror is best-effort
  }

  // Look up company name for the invite email
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('organization_id', guard.orgId)
    .maybeSingle();
  const companyName = (company?.name as string) || 'Ihre Organisation';

  // Deliver credentials out-of-band. Never return tempPassword in the JSON
  // response — it would land in the inviter's DevTools / proxies / extensions.
  try {
    await sendMemberInviteEmail(email, role, companyName, inviteResult.tempPassword);
  } catch (emailError) {
    console.error('Failed to send member invite email', { userId: inviteResult.logtoUserId, error: emailError });
    // Inviter already paid the side-effect cost (Logto user created, member row written).
    // Surface the error so they can retry / contact support.
    return NextResponse.json(
      { error: 'Mitglied angelegt, aber Einladungs-E-Mail konnte nicht gesendet werden. Bitte Support kontaktieren.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    email,
    role,
    alreadyExisted: inviteResult.alreadyExists,
  });
}
