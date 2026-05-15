-- Add branding + locale defaults to companies + create org-scoped storage bucket for logos.
-- Background: /einstellungen previously rendered the initial-setup wizard with empty fields,
-- because the page had no edit-mode and no place to store currency/language/timezone defaults.

-- 1. Add columns ---------------------------------------------------------------

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_url        TEXT,
  ADD COLUMN IF NOT EXISTS default_currency  TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS default_locale    TEXT NOT NULL DEFAULT 'de-DE',
  ADD COLUMN IF NOT EXISTS default_timezone  TEXT NOT NULL DEFAULT 'Europe/Berlin';

COMMENT ON COLUMN public.companies.logo_url IS 'Public storage URL of the company logo (bucket: company-logos)';
COMMENT ON COLUMN public.companies.default_currency IS 'Default currency code for pay bands / decisions (ISO 4217, e.g. EUR)';
COMMENT ON COLUMN public.companies.default_locale IS 'Default UI/report locale (BCP-47, e.g. de-DE)';
COMMENT ON COLUMN public.companies.default_timezone IS 'Default timezone for date display (IANA, e.g. Europe/Berlin)';

-- Sanity guards: keep them short, fail-fast on garbage input.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_default_currency_format'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_default_currency_format
      CHECK (default_currency ~ '^[A-Z]{3}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_default_locale_format'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_default_locale_format
      CHECK (default_locale ~ '^[a-z]{2}(-[A-Z]{2})?$');
  END IF;
END $$;

-- 2. Storage bucket for company logos -----------------------------------------
-- Public-read so the URL can be embedded in <img>/PDFs without signed URLs.
-- Writes are restricted via RLS policies to authenticated members of the
-- owning org via the upload route (service-role bypass not required).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2 * 1024 * 1024,                                 -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS for the bucket: files are named "<organization_id>/logo.<ext>".
-- We let any active admin/HR of the org write objects under their org's prefix.
DROP POLICY IF EXISTS "company_logos_public_read" ON storage.objects;
CREATE POLICY "company_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "company_logos_admin_write" ON storage.objects;
CREATE POLICY "company_logos_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos'
    AND split_part(name, '/', 1) = public.org_id()
    AND public.is_hr_or_admin()
  );

DROP POLICY IF EXISTS "company_logos_admin_update" ON storage.objects;
CREATE POLICY "company_logos_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos'
    AND split_part(name, '/', 1) = public.org_id()
    AND public.is_hr_or_admin()
  );

DROP POLICY IF EXISTS "company_logos_admin_delete" ON storage.objects;
CREATE POLICY "company_logos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-logos'
    AND split_part(name, '/', 1) = public.org_id()
    AND public.is_hr_or_admin()
  );
