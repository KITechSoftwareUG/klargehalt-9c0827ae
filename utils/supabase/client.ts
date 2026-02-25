import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client that injects a fresh Clerk JWT
 * at the NETWORK LAYER before every HTTP request.
 *
 * This is the professional pattern for Clerk + Supabase:
 * - No per-hook token management needed
 * - Token is always fresh (fetched at request time, not render time)
 * - Single client shared via AuthContext
 *
 * @param getToken - Async function that returns a fresh Clerk JWT
 */
export const createSupabaseClient = (getToken: () => Promise<string | null>) => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are not defined");
    }

    return createBrowserClient(supabaseUrl, supabaseKey, {
        global: {
            fetch: async (input: RequestInfo | URL, init: RequestInit = {}) => {
                // Fetch fresh token at request time (not render time)
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
 * @deprecated Use createSupabaseClient() with a getToken function instead.
 * Kept for backward compatibility during migration.
 */
export const createClientWithToken = (clerkToken: string | null) => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are not defined");
    }
    return createBrowserClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                apikey: supabaseKey,
                ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
            },
        },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
};

/**
 * @deprecated Use createSupabaseClient() with a getToken function instead.
 */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);

/**
 * @deprecated Internal adapter for hooks not yet migrated to useAuth().supabase.
 */
export const createSupabaseWithSession = (session: any) => {
    return () => createSupabaseClient(
        () => session?.getToken({ template: 'supabase' }) ?? Promise.resolve(null)
    );
};
