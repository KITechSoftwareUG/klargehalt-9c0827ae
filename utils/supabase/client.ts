import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client that injects a fresh Clerk JWT
 * at the NETWORK LAYER before every HTTP request.
 *
 * - No per-hook token management needed
 * - Token is always fresh (fetched at request time, not render time)
 * - Single client shared via AuthContext
 *
 * @param getToken - Async function returning a fresh Clerk JWT
 */
export const createSupabaseClient = (getToken: () => Promise<string | null>) => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are not defined");
    }

    return createBrowserClient(supabaseUrl, supabaseKey, {
        global: {
            fetch: async (input: RequestInfo | URL, init: RequestInit = {}) => {
                // Fetch a fresh token at request time — never stale
                const token = await getToken().catch(() => null);

                const headers = new Headers(init.headers);
                headers.set('apikey', supabaseKey);
                if (token) {
                    headers.set('Authorization', `Bearer ${token}`);
                }

                return fetch(input, { ...init, headers });
            }
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    });
};

/**
 * Anonymous Supabase client — used when no session is available (loading state).
 * All RLS policies will block unauthenticated requests appropriately.
 */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
