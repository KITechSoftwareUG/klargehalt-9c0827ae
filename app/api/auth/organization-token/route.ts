import { NextResponse } from 'next/server';
import { getOrganizationToken } from '@logto/next/server-actions';
import { getServerAuthContext } from '@/lib/auth/server';
import { getLogtoConfig } from '@/lib/logto';

export async function GET() {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ token: null });
  }

  const token = await getOrganizationToken(getLogtoConfig(), context.activeOrganizationId).catch(() => null);
  return NextResponse.json({ token });
}
