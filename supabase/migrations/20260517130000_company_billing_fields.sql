-- Company billing/invoice details. Needed for correct B2B invoices
-- (postal address + USt-IdNr / VAT-ID) and a dedicated billing contact.
-- Background: /einstellungen → Unternehmen had no place to capture the
-- legally required invoice address or the VAT-ID for reverse-charge.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address        TEXT,
  ADD COLUMN IF NOT EXISTS vat_id         TEXT,
  ADD COLUMN IF NOT EXISTS billing_email  TEXT;

COMMENT ON COLUMN public.companies.address IS 'Postal billing address (free text, multi-line)';
COMMENT ON COLUMN public.companies.vat_id IS 'VAT identification number / USt-IdNr (e.g. DE123456789)';
COMMENT ON COLUMN public.companies.billing_email IS 'Dedicated recipient for billing/invoice mail (falls back to org owner if NULL)';

-- Conservative guards: fail-fast on garbage, but never reject NULL/empty.
-- VAT formats vary across the EU — keep a length sanity check, not a strict
-- regex (deep validation belongs in the app layer).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_vat_id_len'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_vat_id_len
      CHECK (vat_id IS NULL OR char_length(vat_id) BETWEEN 4 AND 20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_billing_email_format'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_billing_email_format
      CHECK (billing_email IS NULL OR billing_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  END IF;
END $$;
