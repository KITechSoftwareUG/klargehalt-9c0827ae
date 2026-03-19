import type { LogtoNextConfig } from '@logto/next';
import { UserScope } from '@logto/next';

export const ACTIVE_ORG_COOKIE = 'kg_active_org';

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getLogtoConfig = (): LogtoNextConfig => ({
  endpoint: getRequiredEnv('LOGTO_ENDPOINT'),
  appId: getRequiredEnv('LOGTO_APP_ID'),
  appSecret: getRequiredEnv('LOGTO_APP_SECRET'),
  baseUrl: getRequiredEnv('APP_BASE_URL'),
  cookieSecret: getRequiredEnv('LOGTO_COOKIE_SECRET'),
  cookieSecure: process.env.NODE_ENV === 'production',
  scopes: [
    UserScope.Profile,
    UserScope.Email,
    UserScope.Organizations,
    UserScope.OrganizationRoles,
  ],
});

export const getLogtoSignInRedirectUri = () => new URL('/callback', getLogtoConfig().baseUrl).toString();
