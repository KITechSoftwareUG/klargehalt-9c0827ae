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

export const getServerAuthContext = async () => {
  const context = await getLogtoContext(getLogtoConfig(), { fetchUserInfo: true });
  const user = mapLogtoUser(context.claims, context.userInfo);
  const organizations = getOrganizationsFromClaims(context.claims);
  const activeOrganizationId = await getActiveOrganizationIdFromCookies();

  return {
    ...context,
    user,
    organizations,
    activeOrganizationId,
    activeOrganization:
      organizations.find(({ id }) => id === activeOrganizationId) ?? null,
  };
};
