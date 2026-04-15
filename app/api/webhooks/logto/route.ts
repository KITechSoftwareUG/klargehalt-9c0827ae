import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getAdminClient = () => createClient(supabaseUrl, supabaseServiceKey);

type LogtoWebhookEvent =
  | 'User.Created'
  | 'User.Data.Updated'
  | 'User.Deleted'
  | 'Organization.Membership.Updated'
  | 'OrganizationRole.Scopes.Updated';

type LogtoWebhookPayload = {
  event: LogtoWebhookEvent;
  createdAt: string;
  hookId: string;
  data?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

type LogtoUserData = {
  id: string;
  primaryEmail?: string | null;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  customData?: Record<string, unknown>;
};

function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-webhook-secret');
  const expected = process.env.LOGTO_WEBHOOK_SECRET;

  if (!expected) {
    console.error('LOGTO_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!secret) {
    return false;
  }

  try {
    const a = Buffer.from(secret);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractUserData(payload: LogtoWebhookPayload): LogtoUserData | null {
  const data = (payload.body ?? payload.data) as LogtoUserData | undefined;
  if (!data?.id) return null;
  return data;
}

async function handleUserCreated(user: LogtoUserData) {
  const supabase = getAdminClient();

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      email: user.primaryEmail || '',
      full_name: user.name || user.username || '',
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('Webhook: Failed to upsert profile', error);
    throw error;
  }

  console.log(`Webhook: Profile synced for user ${user.id}`);
}

async function handleUserUpdated(user: LogtoUserData) {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = {};
  if (user.primaryEmail !== undefined) updates.email = user.primaryEmail || '';
  if (user.name !== undefined) updates.full_name = user.name || '';

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id);

  if (error) {
    console.error('Webhook: Failed to update profile', error);
    throw error;
  }

  console.log(`Webhook: Profile updated for user ${user.id}`);
}

async function handleUserDeleted(user: LogtoUserData) {
  const supabase = getAdminClient();

  const { error: roleError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', user.id);

  if (roleError) {
    console.error('Webhook: Failed to delete user roles', roleError);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', user.id);

  if (profileError) {
    console.error('Webhook: Failed to delete profile', profileError);
    throw profileError;
  }

  console.log(`Webhook: User ${user.id} data cleaned up`);
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  if (!supabaseServiceKey) {
    console.error('Webhook: SUPABASE_SERVICE_ROLE_KEY not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let payload: LogtoWebhookPayload;
  try {
    payload = (await request.json()) as LogtoWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event } = payload;
  console.log(`Webhook: Received ${event}`);

  try {
    switch (event) {
      case 'User.Created': {
        const user = extractUserData(payload);
        if (user) await handleUserCreated(user);
        break;
      }
      case 'User.Data.Updated': {
        const user = extractUserData(payload);
        if (user) await handleUserUpdated(user);
        break;
      }
      case 'User.Deleted': {
        const user = extractUserData(payload);
        if (user) await handleUserDeleted(user);
        break;
      }
      case 'Organization.Membership.Updated':
      case 'OrganizationRole.Scopes.Updated': {
        console.log(`Webhook: ${event} received (org sync placeholder)`);
        break;
      }
      default:
        console.log(`Webhook: Unhandled event ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Webhook: Error processing ${event}`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
