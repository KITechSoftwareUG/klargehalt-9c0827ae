import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Current contract bundle version. Bump this string when the AGB / Datenschutz
 * / AVV change materially — existing acceptances for older versions then no
 * longer satisfy the checkout gate, forcing re-acceptance (correct behaviour).
 */
export const CONTRACT_VERSION = '2026-05-16';

export interface RequiredDocument {
  key: string;
  label: string;
  href: string;
}

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : 'https://klargehalt.de';

/**
 * Documents the customer must accept before a binding paid subscription.
 * The AVV (Art. 28 DSGVO) is currently part of the Datenschutzerklärung's
 * Auftragsverarbeitung section — a dedicated lawyer-reviewed AVV document is a
 * tracked post-launch follow-up.
 */
export const REQUIRED_DOCUMENTS: readonly RequiredDocument[] = [
  { key: 'agb', label: 'Allgemeine Geschäftsbedingungen (AGB)', href: `${ROOT}/agb` },
  { key: 'datenschutz', label: 'Datenschutzerklärung', href: `${ROOT}/datenschutz` },
  { key: 'avv', label: 'Auftragsverarbeitungsvertrag (AVV, Art. 28 DSGVO)', href: `${ROOT}/datenschutz` },
] as const;

/** Deterministic hash of the accepted bundle — stored on each acceptance. */
export const CONTRACT_CONTENT_HASH = createHash('sha256')
  .update(`${REQUIRED_DOCUMENTS.map((d) => d.key).join('|')}@${CONTRACT_VERSION}`)
  .digest('hex');

/**
 * True iff the org has a recorded acceptance for the current contract version.
 * Fail-closed: on any query error returns false so checkout is blocked rather
 * than silently bypassing the legal gate.
 */
export async function checkContractsAccepted(
  orgId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase
    .from('contract_acceptances')
    .select('id')
    .eq('organization_id', orgId)
    .eq('document_version', CONTRACT_VERSION)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[contracts] gate check failed (fail-closed):', error.message);
    return false;
  }
  return Boolean(data);
}
