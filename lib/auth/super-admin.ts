import 'server-only';

const SUPER_ADMIN_USER_ID = process.env.SUPER_ADMIN_USER_ID ?? '';

/**
 * Constant-time comparison so we don't expose the configured ID through timing.
 * Returns false if either side is empty (no super-admin configured = no access).
 */
export function isSuperAdminUserId(userId: string | null | undefined): boolean {
  if (!userId || !SUPER_ADMIN_USER_ID) return false;
  if (userId.length !== SUPER_ADMIN_USER_ID.length) return false;
  let diff = 0;
  for (let i = 0; i < userId.length; i++) {
    diff |= userId.charCodeAt(i) ^ SUPER_ADMIN_USER_ID.charCodeAt(i);
  }
  return diff === 0;
}
