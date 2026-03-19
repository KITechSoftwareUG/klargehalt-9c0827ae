import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';

export async function GET() {
  const context = await getServerAuthContext();

  return NextResponse.json({
    isAuthenticated: context.isAuthenticated,
    user: context.user,
    organizations: context.organizations,
    activeOrganizationId: context.activeOrganizationId,
  });
}
