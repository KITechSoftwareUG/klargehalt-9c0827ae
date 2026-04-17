import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

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

/**
 * Verify Logto webhook using HMAC-SHA256 signature.
 * Logto sends a `logto-signature-sha-256` header containing `sha256=<hex-digest>`
 * computed as HMAC-SHA256(rawBody, signingKey).
 *
 * Falls back to shared-secret header (`x-webhook-secret`) for backwards compatibility
 * during migration. Remove the fallback once Logto is configured to send HMAC signatures.
 */
async function verifyWebhookSignature(request: NextRequest): Promise<{ verified: boolean; rawBody: string }> {
  const signingKey = process.env.LOGTO_WEBHOOK_SECRET;

  if (!signingKey) {
    console.error('LOGTO_WEBHOOK_SECRET not configured');
    return { verified: false, rawBody: '' };
  }

  const rawBody = await request.text();

  // Primary: HMAC signature verification (preferred)
  const signatureHeader = request.headers.get('logto-signature-sha-256');
  if (signatureHeader) {
    try {
      const expected = 'sha256=' + createHmac('sha256', signingKey).update(rawBody).digest('hex');
      const a = Buffer.from(signatureHeader);
      const b = Buffer.from(expected);
      const verified = a.length === b.length && timingSafeEqual(a, b);
      return { verified, rawBody };
    } catch {
      return { verified: false, rawBody };
    }
  }

  // Fallback: shared-secret header (remove after Logto HMAC is configured)
  const sharedSecret = request.headers.get('x-webhook-secret');
  if (sharedSecret) {
    try {
      const a = Buffer.from(sharedSecret);
      const b = Buffer.from(signingKey);
      const verified = a.length === b.length && timingSafeEqual(a, b);
      if (verified) {
        console.warn('Webhook: Using deprecated x-webhook-secret verification — migrate to HMAC signature');
      }
      return { verified, rawBody };
    } catch {
      return { verified: false, rawBody };
    }
  }

  return { verified: false, rawBody };
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
  const { verified, rawBody } = await verifyWebhookSignature(request);
  if (!verified) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Webhook: Supabase environment variables not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let payload: LogtoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LogtoWebhookPayload;
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
