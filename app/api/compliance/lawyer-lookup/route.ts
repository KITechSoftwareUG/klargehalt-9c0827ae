import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';

type LogtoUserResponse = {
  id: string;
  primaryEmail?: string | null;
  name?: string | null;
};

const emailQuerySchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

let _tokenCache: { token: string; expiresAt: number } | null = null;
let _refreshPromise: Promise<string> | null = null;

const getManagementToken = async (): Promise<string> => {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt > now + 5000) {
    return _tokenCache.token;
  }

  if (_refreshPromise) {
    return _refreshPromise;
  }

  _refreshPromise = (async () => {
    const endpoint = process.env.LOGTO_ENDPOINT;
    const clientId = process.env.LOGTO_M2M_APP_ID;
    const clientSecret = process.env.LOGTO_M2M_APP_SECRET;
    const resource =
      process.env.LOGTO_MANAGEMENT_API_RESOURCE ?? 'https://admin.logto.app/api';

    if (!endpoint || !clientId || !clientSecret) {
      throw new Error(
        'Missing required Logto M2M environment variables (LOGTO_ENDPOINT, LOGTO_M2M_APP_ID, LOGTO_M2M_APP_SECRET)',
      );
    }

    const response = await fetch(`${endpoint}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        resource,
        scope: 'all',
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch Logto management token: ${response.status} ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    const token = data.access_token;
    if (!token) throw new Error('Logto management token response missing access_token');

    const ttl = (data.expires_in ?? 3600) - 60;
    _tokenCache = { token, expiresAt: Date.now() + ttl * 1000 };
    return token;
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
};

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', context.user!.id)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (!userRole || !['admin', 'hr_manager'].includes(userRole.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get('email') ?? '';

  const parsed = emailQuerySchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige E-Mail-Adresse', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { email } = parsed.data;

  try {
    const token = await getManagementToken();
    const endpoint = process.env.LOGTO_ENDPOINT!;

    const response = await fetch(
      `${endpoint}/api/users?search=${encodeURIComponent(email)}&searchFields[]=primaryEmail`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Logto user search failed: ${response.status} ${errorText}`);
      return NextResponse.json({ error: 'Suche fehlgeschlagen' }, { status: 502 });
    }

    const users = (await response.json()) as LogtoUserResponse[];
    const user = users.find(
      (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        name: user.name ?? null,
        email: user.primaryEmail ?? email,
      },
    });
  } catch (error) {
    console.error('lawyer-lookup error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Suche fehlgeschlagen' }, { status: 500 });
  }
}
