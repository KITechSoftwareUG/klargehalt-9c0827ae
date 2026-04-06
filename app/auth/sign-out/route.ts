import { cookies } from 'next/headers';
import { signOut } from '@logto/next/server-actions';
import { getLogtoConfig, ACTIVE_ORG_COOKIE } from '@/lib/logto';

export async function GET() {
  // Clear org cookie before Logto sign-out redirect
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);

  const config = getLogtoConfig();
  await signOut(config, config.baseUrl);
}
