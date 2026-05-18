-- Per-user e-mail notification preferences.
--
-- Scope decision: only genuinely OPTIONAL, non-critical mail is gateable.
-- Billing, security, invites, trial-ending and compliance-workflow mail stay
-- always-on (this is a litigation-defense compliance product — a user must
-- not be able to silently disable a legally-relevant notification). The table
-- is intentionally extensible: new opt-out categories = one BOOLEAN column.
--
-- Self-scoping is enforced at the API layer (service-role + explicit
-- user_id from the auth context), consistent with the `profiles` table
-- convention. RLS below adds org isolation as defense-in-depth.

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id          TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL,
  product_updates  BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_notification_preferences IS
  'Per-user opt-out flags for non-critical e-mail. Critical/transactional mail is never gated.';
COMMENT ON COLUMN public.user_notification_preferences.product_updates IS
  'Product tips & mid-trial nudge mail (sendMidTrialEmail). Default opt-in.';

CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_org
  ON public.user_notification_preferences(organization_id);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Mirrors the profiles table policy: org-tenant isolation via JWT aud.
-- True per-user scoping is enforced server-side (service-role + user_id),
-- because the Logto user id is not available as an RLS primitive here.
DROP POLICY IF EXISTS "tenant_isolation" ON public.user_notification_preferences;
CREATE POLICY "tenant_isolation" ON public.user_notification_preferences
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());
