import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email';

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
 * Collect all valid signing keys for Logto webhooks.
 * Logto auto-generates a unique signingKey per webhook and these cannot be changed via API.
 * We accept: LOGTO_WEBHOOK_SECRET (shared secret) + any LOGTO_WEBHOOK_SIGNING_KEY_* vars.
 */
function getSigningKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.LOGTO_WEBHOOK_SECRET;
  if (primary) keys.push(primary);

  // Support per-webhook signing keys: LOGTO_WEBHOOK_SIGNING_KEY_1, _2, etc.
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('LOGTO_WEBHOOK_SIGNING_KEY_') && value) {
      keys.push(value);
    }
  }
  return keys;
}

/**
 * Verify Logto webhook using HMAC-SHA256 signature.
 * Logto sends a `logto-signature-sha-256` header containing `sha256=<hex-digest>`
 * computed as HMAC-SHA256(rawBody, signingKey).
 *
 * Falls back to shared-secret header (`x-webhook-secret`) for backwards compatibility.
 */
async function verifyWebhookSignature(request: NextRequest): Promise<{ verified: boolean; rawBody: string }> {
  const signingKeys = getSigningKeys();

  if (signingKeys.length === 0) {
    console.error('No Logto webhook signing keys configured');
    return { verified: false, rawBody: '' };
  }

  const rawBody = await request.text();

  // Primary: HMAC signature verification (preferred)
  const signatureHeader = request.headers.get('logto-signature-sha-256');
  if (signatureHeader) {
    for (const key of signingKeys) {
      try {
        const expected = 'sha256=' + createHmac('sha256', key).update(rawBody).digest('hex');
        const a = Buffer.from(signatureHeader);
        const b = Buffer.from(expected);
        if (a.length === b.length && timingSafeEqual(a, b)) {
          return { verified: true, rawBody };
        }
      } catch {
        continue;
      }
    }
    return { verified: false, rawBody };
  }

  // Fallback: shared-secret header
  const sharedSecret = request.headers.get('x-webhook-secret');
  if (sharedSecret) {
    for (const key of signingKeys) {
      try {
        const a = Buffer.from(sharedSecret);
        const b = Buffer.from(key);
        if (a.length === b.length && timingSafeEqual(a, b)) {
          return { verified: true, rawBody };
        }
      } catch {
        continue;
      }
    }
    return { verified: false, rawBody };
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

  // Insert-or-update but NEVER clobber organization_id (onboarding may have
  // set it before this webhook arrives). Use manual check + conditional write.
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('profiles')
      .update({
        email: user.primaryEmail || '',
        full_name: user.name || user.username || '',
      })
      .eq('user_id', user.id);
    if (error) {
      console.error('Webhook: Failed to update profile', error);
      throw error;
    }
  } else {
    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      email: user.primaryEmail || '',
      full_name: user.name || user.username || '',
    });
    if (error) {
      console.error('Webhook: Failed to insert profile', error);
      throw error;
    }
  }

  if (user.primaryEmail) {
    try {
      await sendWelcomeEmail(user.primaryEmail, user.name || user.username || '');
    } catch (emailError) {
      console.error('Webhook: Failed to send welcome email', emailError);
    }
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

  const { event, hookId, createdAt } = payload;

  // Idempotency: deduplicate using hookId + createdAt as a stable event fingerprint.
  // Logto does not provide a unique event ID, so we derive one from the webhook metadata.
  const eventFingerprint = `logto:${hookId}:${createdAt}`;
  const supabase = getAdminClient();
  const { data: alreadyProcessed } = await supabase
    .from('processed_stripe_events')
    .select('event_id')
    .eq('event_id', eventFingerprint)
    .maybeSingle();

  if (alreadyProcessed) {
    console.log(`Webhook: duplicate Logto event ${eventFingerprint}, skipping`);
    return NextResponse.json({ success: true });
  }

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

    // Mark event as processed to prevent duplicate processing on retries
    await supabase
      .from('processed_stripe_events')
      .insert({ event_id: eventFingerprint })
      .throwOnError();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Webhook: Error processing ${event}`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
