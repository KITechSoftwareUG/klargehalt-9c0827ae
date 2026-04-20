/**
 * POST /api/onboarding/complete
 *
 * Atomic server-side onboarding bootstrap. Creates the org (if needed),
 * company, user_role, profile, and onboarding_data record in one transaction-
 * like flow using the Supabase service role key, bypassing RLS.
 *
 * This avoids the client-side race condition where the Supabase client memo
 * in useAuth still holds the anon client reference while an onboarding
 * submission is in flight — which caused RLS to reject the companies INSERT
 * and left users with profile + user_role but no company row.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { getServerAuthContext } from '@/lib/auth/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/logto';
import { createOrganizationWithMembership } from '@/lib/logto-management';
import { TRIAL_DURATION_DAYS, TRIAL_TIER, type SubscriptionTier } from '@/lib/subscription';

interface OnboardingCompletePayload {
  fullName: string;
  companyName: string;
  industry?: string;
  companySize: '1-50' | '51-250' | '251-1000';
  selectedPlan: SubscriptionTier;
  selfReportedRole: 'admin' | 'hr_manager';
  consultingOption: 'self-service' | 'guided';
}

const getAdmin = () =>
  createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.user) {
    return NextResponse.json(
      { error: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', reauth: true },
      { status: 401 },
    );
  }

  let payload: OnboardingCompletePayload;
  try {
    payload = (await request.json()) as OnboardingCompletePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { fullName, companyName, industry, companySize, selectedPlan, selfReportedRole, consultingOption } = payload;

  if (!fullName?.trim() || !companyName?.trim()) {
    return NextResponse.json({ error: 'fullName and companyName are required' }, { status: 400 });
  }

  const admin = getAdmin();
  const userId = context.user.id;

  try {
    let organizationId: string | null = context.organizations[0]?.id ?? null;
    let organizationName: string | null = context.organizations[0]?.name ?? null;

    if (!organizationId) {
      try {
        const org = await createOrganizationWithMembership({
          name: companyName,
          userId,
        });
        organizationId = org.id;
        organizationName = org.name;
      } catch (orgError) {
        const message = orgError instanceof Error ? orgError.message : 'Unknown Logto error';
        if (message.includes('User not found')) {
          return NextResponse.json(
            { error: 'Ihre Sitzung ist ungültig. Bitte melden Sie sich erneut an.', reauth: true },
            { status: 401 },
          );
        }
        throw orgError;
      }
    }

    if (!organizationId) {
      throw new Error('Organisation konnte nicht erstellt werden.');
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { data: existingCompany } = await admin
      .from('companies')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    let companyId: string;
    if (existingCompany) {
      const { data, error } = await admin
        .from('companies')
        .update({
          name: companyName,
          industry: industry ?? null,
          size: companySize,
          subscription_tier: TRIAL_TIER,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq('id', existingCompany.id)
        .select('id')
        .single();
      if (error) throw error;
      companyId = data.id;
    } else {
      const { data, error } = await admin
        .from('companies')
        .insert({
          name: companyName,
          industry: industry ?? null,
          size: companySize,
          organization_id: organizationId,
          created_by: userId,
          subscription_tier: TRIAL_TIER,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select('id')
        .single();
      if (error) throw error;
      companyId = data.id;
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        user_id: userId,
        email: context.user.email ?? '',
        full_name: fullName,
        company_name: companyName,
        organization_id: organizationId,
      },
      { onConflict: 'user_id' },
    );
    if (profileError) throw profileError;

    const { data: existingRole } = await admin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existingRole) {
      const { error: roleError } = await admin
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('id', existingRole.id);
      if (roleError) throw roleError;
    } else {
      const { error: roleError } = await admin.from('user_roles').insert({
        user_id: userId,
        organization_id: organizationId,
        role: 'admin',
      });
      if (roleError) throw roleError;
    }

    const { error: onboardingError } = await admin.from('onboarding_data').upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        company_id: companyId,
        company_size: companySize,
        selected_plan: selectedPlan,
        self_reported_role: selfReportedRole,
        consulting_option: consultingOption,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (onboardingError) throw onboardingError;

    return NextResponse.json({
      organization: { id: organizationId, name: organizationName },
      companyId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onboarding fehlgeschlagen.';
    console.error('onboarding/complete error:', message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
