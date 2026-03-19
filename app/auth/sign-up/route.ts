import { signIn } from '@logto/next/server-actions';
import { getLogtoConfig, getLogtoSignInRedirectUri } from '@/lib/logto';

export async function GET() {
  await signIn(getLogtoConfig(), {
    redirectUri: getLogtoSignInRedirectUri(),
    interactionMode: 'signUp',
  });
}
