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

const getLocalE2EAuthContext = async () => {
  // Restrict to development/test only — staging/preview/anything-else must
  // never accept the cookie-based impersonation backdoor.
  const isE2ESafeEnv =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (!isE2ESafeEnv || process.env.KLARGEHALT_E2E_AUTH !== '1') {
    return null;
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get('kg_e2e_user')?.value;
  const email = cookieStore.get('kg_e2e_email')?.value ?? 'hr.e2e@klargehalt.local';
  const activeOrganizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (!userId || !activeOrganizationId) {
    return null;
  }

  const user: AppAuthUser = {
    id: userId,
    email,
    firstName: 'E2E',
    fullName: 'E2E HR Lead',
    imageUrl: null,
    primaryEmailAddress: { emailAddress: email },
    emailAddresses: [{ emailAddress: email }],
  };

  const organization = { id: activeOrganizationId, name: null };

  return {
    isAuthenticated: true as const,
    claims: {
      sub: userId,
      email,
      organizations: [activeOrganizationId],
    },
    userInfo: undefined,
    user,
    organizations: [organization],
    activeOrganizationId,
    activeOrganization: organization,
  };
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
  const localE2EContext = await getLocalE2EAuthContext();
  if (localE2EContext) {
    return localE2EContext;
  }

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
  const cookieActiveOrganizationId = await getActiveOrganizationIdFromCookies();

  // JWT lag: Logto only updates the organizations claim on next login. After
  // onboarding the JWT is still empty, but the kg_active_org cookie is the
  // source of truth. Append the cookie org so the client resolves
  // activeOrganization correctly without forcing a re-login.
  const organizations =
    cookieActiveOrganizationId && !jwtOrganizations.some((o) => o.id === cookieActiveOrganizationId)
      ? [...jwtOrganizations, { id: cookieActiveOrganizationId, name: null as null }]
      : jwtOrganizations;

  // Fallback: kg_active_org is a session cookie (no maxAge) so a browser
  // restart deletes it while the Logto session survives. Without this, a
  // returning user gets organizations.length > 0 but activeOrganization ===
  // null — and because AuthLauncher/Onboarding key off organizations.length
  // while PortalLayout keys off orgId, that drives an infinite
  // /sign-in → /dashboard → /onboarding redirect loop. Default to the first
  // JWT org (mirrors the equivalent middleware.ts recovery branch).
  const activeOrganizationId =
    cookieActiveOrganizationId ?? jwtOrganizations[0]?.id ?? null;

  return {
    ...context,
    user,
    organizations,
    activeOrganizationId,
    activeOrganization: organizations.find(({ id }) => id === activeOrganizationId) ?? null,
  };
};
