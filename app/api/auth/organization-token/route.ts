import { NextResponse } from 'next/server';
import { getOrganizationToken } from '@logto/next/server-actions';
import { getActiveOrganizationIdFromCookies } from '@/lib/auth/server';
import { getLogtoConfig } from '@/lib/logto';

export async function GET() {
  const organizationId = await getActiveOrganizationIdFromCookies();

  if (!organizationId) {
    return NextResponse.json({ token: null });
  }

  const token = await getOrganizationToken(getLogtoConfig(), organizationId).catch(() => null);
  return NextResponse.json({ token });
}
