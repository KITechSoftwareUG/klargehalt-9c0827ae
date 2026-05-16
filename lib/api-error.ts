/**
 * Friendly API error helper.
 *
 * Converts raw server responses and caught errors into safe, user-facing
 * German messages — never leaking stack traces, HTML pages, or Postgres codes.
 */

/** Returns true if the string looks like an internal dump we must not show. */
function isInternalDump(s: string): boolean {
  if (s.length >= 200) return true;
  // Stack-trace lines
  if (/\bat\s+\S+\s+\(/.test(s)) return true;
  // "Error:" prefix typical of Node stack dumps
  if (/^Error:/.test(s)) return true;
  // Postgres SQLSTATE codes (e.g. 42703, 23505 — 5 chars starting with 2 digits)
  if (/\b\d{2}[A-Z0-9]{3}\b/.test(s)) return true;
  // HTML responses
  if (/<\/?[a-zA-Z]/.test(s)) return true;
  return false;
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Sitzung abgelaufen. Bitte neu anmelden.',
  403: 'Keine Berechtigung für diese Aktion.',
  429: 'Zu viele Anfragen. Bitte kurz warten.',
};

/**
 * Extracts a friendly German error message from a failed `fetch` Response.
 *
 * Priority order:
 *   1. Known HTTP status → fixed German message (except 402 and 409 which
 *      prefer the server's JSON message when available).
 *   2. Server JSON `error` or `message` field that is short and safe.
 *   3. `fallback`.
 */
export async function friendlyApiError(
  res: Response,
  fallback = 'Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.',
): Promise<string> {
  // For status codes with fixed messages (not 402/409 where server text wins)
  const fixedMsg = STATUS_MESSAGES[res.status];
  if (fixedMsg !== undefined) return fixedMsg;

  // 5xx range
  if (res.status >= 500) return 'Serverfehler. Bitte später erneut versuchen.';

  // For 402 and 409, try server JSON first, then fall back to defaults
  let serverMsg: string | null = null;
  try {
    const text = await res.text();
    if (text) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        const candidate = typeof obj['error'] === 'string'
          ? obj['error']
          : typeof obj['message'] === 'string'
            ? obj['message']
            : null;
        if (candidate !== null && !isInternalDump(candidate)) {
          serverMsg = candidate;
        }
      }
    }
  } catch {
    // Response body unreadable — fall through
  }

  if (res.status === 402) {
    return serverMsg ?? 'Limit erreicht — bitte Tarif prüfen.';
  }
  if (res.status === 409) {
    return serverMsg ?? 'Konflikt: Eintrag existiert bereits.';
  }

  // Any other 4xx: use server message if safe
  if (serverMsg !== null) return serverMsg;

  return fallback;
}

/**
 * Extracts a friendly German error message from a caught `unknown` error.
 *
 * Returns `Error.message` only when it is short and not an internal dump.
 * Falls back to `fallback` otherwise.
 */
export function friendlyError(
  e: unknown,
  fallback = 'Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.',
): string {
  if (e instanceof Error && e.message && !isInternalDump(e.message)) {
    return e.message;
  }
  return fallback;
}
