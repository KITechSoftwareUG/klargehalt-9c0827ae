import { signIn } from '@logto/next/server-actions';
import { type NextRequest } from 'next/server';
import { getLogtoConfig, getLogtoSignInRedirectUri } from '@/lib/logto';

export async function GET(req: NextRequest) {
  const loginHint = req.nextUrl.searchParams.get('login_hint') ?? undefined;
  await signIn(getLogtoConfig(), {
    redirectUri: getLogtoSignInRedirectUri(),
    ...(loginHint ? { extraParams: { login_hint: loginHint } } : {}),
  });
}
