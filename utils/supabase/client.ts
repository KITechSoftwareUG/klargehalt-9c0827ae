import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
    createBrowserClient(
        supabaseUrl!,
        supabaseKey!,
    );

export const createClientWithToken = (clerkToken: string | null) => {
    return createBrowserClient(
        supabaseUrl!,
        supabaseKey!,
        {
            global: {
                headers: {
                    // Always include the apikey header (the anon key)
                    apikey: supabaseKey!,
                    // Only include the Authorization header if we have a token
                    ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }
        }
    );
};
