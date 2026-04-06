import { cookies } from 'next/headers';
import { getLogtoContext } from '@logto/next/server-actions';
import type { IdTokenClaims, UserInfoResponse } from '@logto/next';
import { ACTIVE_ORG_COOKIE, getLogtoConfig } from '@/lib/logto';

export type AppAuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  primaryEmailAddress: {
    emailAddress: string;
  } | null;
  emailAddresses: Array<{
    emailAddress: string;
  }>;
};

export type AppOrganization = {
  id: string;
  name: string | null;
};

const getFirstName = (fullName: string | null | undefined) => {
  if (!fullName) {
    return null;
  }

  const [firstName] = fullName.trim().split(/\s+/);
  return firstName || null;
};

export const mapLogtoUser = (
  claims?: IdTokenClaims,
  userInfo?: UserInfoResponse
): AppAuthUser | null => {
  const userId = claims?.sub;

  if (!userId) {
    return null;
  }

  const email = userInfo?.email ?? claims?.email ?? null;
  const fullName = userInfo?.name ?? claims?.name ?? userInfo?.username ?? claims?.username ?? null;
  const firstName = getFirstName(fullName);
  const imageUrl = userInfo?.picture ?? claims?.picture ?? null;

  return {
    id: userId,
    email,
    firstName,
    fullName,
    imageUrl,
    primaryEmailAddress: email ? { emailAddress: email } : null,
    emailAddresses: email ? [{ emailAddress: email }] : [],
  };
};

export const getOrganizationsFromClaims = (claims?: IdTokenClaims): AppOrganization[] =>
  (claims?.organizations ?? []).map((organizationId) => ({
    id: organizationId,
    name: null,
  }));

export const getActiveOrganizationIdFromCookies = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
};

const UNAUTHENTICATED_CONTEXT = {
  isAuthenticated: false as const,
  claims: undefined,
  userInfo: undefined,
  user: null,
  organizations: [] as AppOrganization[],
  activeOrganizationId: null,
  activeOrganization: null,
};

export const getServerAuthContext = async () => {
  let context: Awaited<ReturnType<typeof getLogtoContext>>;

  try {
    context = await getLogtoContext(getLogtoConfig(), { fetchUserInfo: true });
  } catch (error) {
    // invalid_grant = stale/broken session (deleted user, expired refresh token).
    // Do NOT fallback to reading stale ID token claims — treat as unauthenticated.
    // The client will redirect to /auth/sign-in for a fresh session.
    console.error('Auth context error (treating as unauthenticated):', error instanceof Error ? error.message : error);
    return UNAUTHENTICATED_CONTEXT;
  }

  if (!context.isAuthenticated) {
    return UNAUTHENTICATED_CONTEXT;
  }

  const user = mapLogtoUser(context.claims, context.userInfo);
  const jwtOrganizations = getOrganizationsFromClaims(context.claims);
  const activeOrganizationId = await getActiveOrganizationIdFromCookies();

  // JWT may not contain the org yet (Logto updates it on next login).
  // If the cookie has an org that's not in the JWT, include it so the app works
  // immediately after onboarding. Real enforcement is via Supabase RLS.
  const organizations =
    activeOrganizationId && !jwtOrganizations.some(({ id }) => id === activeOrganizationId)
      ? [...jwtOrganizations, { id: activeOrganizationId, name: null }]
      : jwtOrganizations;

  return {
    ...context,
    user,
    organizations,
    activeOrganizationId,
    activeOrganization:
      organizations.find(({ id }) => id === activeOrganizationId) ?? null,
  };
};
