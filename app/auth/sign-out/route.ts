import { cookies } from 'next/headers';
import { signOut } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';
import { getLogtoConfig, ACTIVE_ORG_COOKIE } from '@/lib/logto';

export async function GET() {
  // Clear only our custom org cookie here.
  // IMPORTANT: Do NOT delete logto_* cookies manually before calling signOut().
  // The Logto SDK reads its own session cookie (logto_{appId}) inside signOut()
  // to construct the end-session URL with the required id_token_hint parameter.
  // Without id_token_hint, Logto does not end the server-side SSO session at
  // auth.klargehalt.de, causing users to be silently re-authenticated on the
  // next sign-in attempt. The SDK calls this.storage.destroy() internally to
  // clear its own cookies after reading them.
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);

  const config = getLogtoConfig();

  try {
    await signOut(config, config.baseUrl);
  } catch (error) {
    // Re-throw NEXT_REDIRECT — Next.js catches this internally and sends the 307 response.
    if (typeof (error as Record<string, unknown>)?.digest === 'string') {
      throw error;
    }
    // Logto session was already invalid or signOut failed (e.g. broken refresh token).
    // Clear the Logto session cookie manually and redirect to sign-in as fallback.
    console.error('[sign-out] Logto signOut failed, forcing redirect:', error instanceof Error ? error.message : error);
    cookieStore.delete(`logto:${config.appId}`);
    return NextResponse.redirect(new URL('/sign-in', config.baseUrl));
  }
}
