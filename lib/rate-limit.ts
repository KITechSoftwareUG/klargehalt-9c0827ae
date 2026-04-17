import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Supabase-backed rate limiter.
 * Uses a PostgreSQL function for atomic check-and-increment across all instances.
 *
 * @param key       Unique key (e.g. `${userId}:endpoint`)
 * @param limit     Max requests per window
 * @param windowMs  Window size in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const windowSeconds = Math.ceil(windowMs / 1000);

    const { data, error } = await supabase.rpc('check_rate_limit', {
      _key: key,
      _limit: limit,
      _window_seconds: windowSeconds,
    });

    if (error) {
      console.error('Rate limit check failed, allowing request:', error.message);
      return true;
    }

    return data as boolean;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Rate limit check failed, allowing request:', message);
    return true;
  }
}
