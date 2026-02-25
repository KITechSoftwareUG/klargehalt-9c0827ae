import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation for development help
if (typeof window !== 'undefined') {
    if (!supabaseUrl) console.error("Supabase URL is missing!");
    if (!supabaseKey) console.error("Supabase Anon Key is missing!");
}

export const createClient = () => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are not defined");
    }
    return createBrowserClient(supabaseUrl, supabaseKey);
};

export const createClientWithToken = (clerkToken: string | null) => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are not defined");
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseKey,
        {
            global: {
                headers: {
                    // Supabase-ssr's createBrowserClient handles the apikey header automatically
                    // based on the second argument. We only need the Authorization header.
                    apikey: supabaseKey,
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
