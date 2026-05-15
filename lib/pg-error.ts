import type { PostgrestError } from '@supabase/supabase-js';

export interface HumanizedPgError {
  message: string;
  status: number; // suggested HTTP status
}

/**
 * Maps Postgres / PostgREST error codes to user-friendly German messages
 * and appropriate HTTP status codes, without leaking schema internals beyond
 * public column / constraint names.
 *
 * Use this in API routes that perform single-row writes and want to surface
 * actionable diagnostics to clients (e.g. the CSV import wizard). The full
 * raw error is preserved via console.error at the call site for ops debugging.
 */
export function humanizePgError(error: PostgrestError, entity: string): HumanizedPgError {
  const code = error.code;
  const msg = error.message ?? '';
  const details = error.details ?? '';
  const haystack = `${msg} ${details}`.toLowerCase();

  // P0001: trigger raise_exception — these messages come from our own triggers
  // and are already user-facing German. Surface them verbatim (truncated).
  if (code === 'P0001') {
    const cleaned = msg.replace(/^ERROR:\s*/i, '').trim();
    return {
      message: cleaned || `Vorgang nicht zulässig (${entity})`,
      status: 400,
    };
  }

  // 23505 unique_violation
  if (code === '23505') {
    if (haystack.includes('employee_number')) {
      return { message: 'Mitarbeiternummer existiert bereits', status: 409 };
    }
    if (haystack.includes('email')) {
      return { message: 'E-Mail-Adresse existiert bereits', status: 409 };
    }
    if (haystack.includes('department') && haystack.includes('name')) {
      return { message: 'Abteilung mit diesem Namen existiert bereits', status: 409 };
    }
    if (haystack.includes('job_profile') || haystack.includes('title')) {
      return { message: 'Job-Profil mit diesem Titel existiert bereits', status: 409 };
    }
    return { message: 'Datensatz existiert bereits (Duplikat)', status: 409 };
  }

  // 23503 foreign_key_violation
  if (code === '23503') {
    if (haystack.includes('department_id')) {
      return { message: 'Abteilung nicht gefunden', status: 400 };
    }
    if (haystack.includes('job_profile_id')) {
      return { message: 'Job-Profil nicht gefunden', status: 400 };
    }
    if (haystack.includes('job_level_id')) {
      return { message: 'Karrierestufe nicht gefunden', status: 400 };
    }
    if (haystack.includes('pay_band_id')) {
      return { message: 'Gehaltsband nicht gefunden', status: 400 };
    }
    if (haystack.includes('company_id') || haystack.includes('organization_id')) {
      return { message: 'Organisation nicht gefunden', status: 400 };
    }
    return { message: 'Verknüpfter Datensatz nicht gefunden', status: 400 };
  }

  // 23514 check_violation (enum / value constraints)
  if (code === '23514') {
    if (haystack.includes('gender')) {
      return { message: 'Ungültiger Wert für Geschlecht', status: 400 };
    }
    if (haystack.includes('employment_type')) {
      return { message: 'Ungültiger Wert für Anstellungsart', status: 400 };
    }
    if (haystack.includes('salary') || haystack.includes('pay')) {
      return { message: 'Ungültiger Gehaltswert', status: 400 };
    }
    return { message: 'Ungültiger Wert für ein Pflichtfeld', status: 400 };
  }

  // 23502 not_null_violation
  if (code === '23502') {
    const colMatch = /column "(\w+)"/i.exec(msg);
    if (colMatch) {
      return { message: `Pflichtfeld fehlt: ${colMatch[1]}`, status: 400 };
    }
    return { message: 'Pflichtfeld fehlt', status: 400 };
  }

  // 22P02 invalid_text_representation (e.g. malformed date)
  if (code === '22P02') {
    if (haystack.includes('date')) {
      return { message: 'Ungültiges Datumsformat', status: 400 };
    }
    if (haystack.includes('uuid')) {
      return { message: 'Ungültige ID', status: 400 };
    }
    return { message: 'Ungültiges Datenformat', status: 400 };
  }

  // 22001 string_data_right_truncation (value too long)
  if (code === '22001') {
    return { message: 'Wert zu lang für Feld', status: 400 };
  }

  // 42501 insufficient_privilege — RLS denied (should not happen for service-role)
  if (code === '42501') {
    return { message: 'Keine Berechtigung für diesen Vorgang', status: 403 };
  }

  // Unknown — generic fallback. Keep the entity name so support can correlate logs.
  return { message: `Fehler beim Speichern (${entity})`, status: 500 };
}
