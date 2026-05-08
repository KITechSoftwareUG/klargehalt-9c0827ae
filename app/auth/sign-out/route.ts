import { cookies } from 'next/headers';
import { signOut } from '@logto/next/server-actions';
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
  await signOut(config, config.baseUrl);
}
