import { signOut } from '@logto/next/server-actions';
import { getLogtoConfig } from '@/lib/logto';

export async function GET() {
  const config = getLogtoConfig();
  await signOut(config, config.baseUrl);
}
