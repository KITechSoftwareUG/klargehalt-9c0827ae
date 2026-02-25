import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation for development help
if (typeof window !== 'undefined') {
    const keyStart = supabaseKey ? supabaseKey.substring(0, 5) : "NONE";
    const keyEnd = supabaseKey ? supabaseKey.substring(supabaseKey.length - 5) : "NONE";
    console.log("DEBUG - Supabase URL:", supabaseUrl);
    console.log(`DEBUG - Supabase Key Check: ${keyStart}...${keyEnd}`);
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
                    ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
                    // Key-Check and V2.4 update as per instruction
                    'X-App-Version': 'klargehalt (V2.4)',
                    'X-Key-Check': supabaseKey ? 'present' : 'missing',
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
