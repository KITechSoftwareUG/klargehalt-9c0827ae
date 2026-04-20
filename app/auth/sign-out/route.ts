import { cookies } from 'next/headers';
import { signOut } from '@logto/next/server-actions';
import { getLogtoConfig, ACTIVE_ORG_COOKIE } from '@/lib/logto';

export async function GET() {
  // Clear org cookie + any other app-local auth cookies before Logto kills
  // its own session cookie. Logto's signOut() redirects to its end-session
  // endpoint which clears the logto_* cookies on auth.klargehalt.de.
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);

  // Best-effort sweep of any stray logto session cookies bound to the app
  // origin (belt-and-suspenders — Logto SDK normally handles its own cookies
  // but we've seen edge cases where a stale cookie survives).
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith('logto_') || c.name === 'logtoCookies') {
      cookieStore.delete(c.name);
    }
  }

  const config = getLogtoConfig();
  await signOut(config, config.baseUrl);
}
