import { NextResponse } from 'next/server';
import { getOrganizationToken } from '@logto/next/server-actions';
import { getServerAuthContext } from '@/lib/auth/server';
import { getLogtoConfig } from '@/lib/logto';
import { createHmac } from 'crypto';

const base64UrlJson = (value: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const createLocalE2EOrgToken = (userId: string, email: string | null, organizationId: string) => {
  const secret =
    process.env.SUPABASE_JWT_SECRET ??
    'super-secret-jwt-token-with-at-least-32-characters-long';
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlJson({
    aud: `urn:logto:organization:${organizationId}`,
    role: 'authenticated',
    sub: userId,
    email: email ?? '',
    org_id: organizationId,
    iat: now,
    exp: now + 60 * 60,
  });
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
};

export async function GET() {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ token: null });
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.KLARGEHALT_E2E_AUTH === '1' &&
    context.user
  ) {
    return NextResponse.json({
      token: createLocalE2EOrgToken(
        context.user.id,
        context.user.email,
        context.activeOrganizationId,
      ),
    });
  }

  const token = await getOrganizationToken(getLogtoConfig(), context.activeOrganizationId).catch(() => null);
  return NextResponse.json({ token });
}
