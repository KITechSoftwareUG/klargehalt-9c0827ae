import { createServiceClient } from '@/lib/supabase/server';

// Opt-out categories. Keep in sync with the
// user_notification_preferences table columns.
export type NotificationCategory = 'product_updates';

/**
 * Whether a non-critical notification of `category` may be sent to
 * `recipientEmail`.
 *
 * FAIL-OPEN by design: any lookup error, missing profile, or missing
 * preference row resolves to `true`. Losing a notification because a
 * preference lookup failed is worse than sending one the user might have
 * muted — and critical mail never calls this in the first place.
 */
export async function shouldSendNotification(
  category: NotificationCategory,
  recipientEmail: string,
): Promise<boolean> {
  if (!recipientEmail) return true;

  try {
    const supabase = createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', recipientEmail)
      .maybeSingle();

    if (profileError || !profile?.user_id) return true;

    const { data: prefs, error: prefsError } = await supabase
      .from('user_notification_preferences')
      .select(category)
      .eq('user_id', profile.user_id as string)
      .maybeSingle();

    if (prefsError || !prefs) return true;

    const value = (prefs as Record<string, unknown>)[category];
    return value !== false;
  } catch {
    return true;
  }
}
