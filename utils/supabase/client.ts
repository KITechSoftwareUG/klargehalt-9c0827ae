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
                // Get the custom header from the Clerk JWT
                headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
            },
            // Disable default auth persistence as we rely on Clerk
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            }
        }
    );
};
