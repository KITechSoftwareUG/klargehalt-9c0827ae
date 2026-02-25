import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation for development help
if (typeof window !== 'undefined') {
    const cleanKey = supabaseKey?.trim();
    const keyStart = cleanKey ? cleanKey.substring(0, 10) : "NONE";
    const keyEnd = cleanKey ? cleanKey.substring(cleanKey.length - 10) : "NONE";
    console.log("[V2.5] Supabase URL:", supabaseUrl);
    console.log(`[V2.5] Key Check: ${keyStart}...${keyEnd} (Length: ${cleanKey?.length})`);
    if (!supabaseUrl) console.error("[V2.5] Supabase URL is missing!");
    if (!cleanKey) console.error("[V2.5] Supabase Anon Key is missing!");
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
                    apikey: supabaseKey?.trim() || '',
                    ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
                    'X-App-Version': 'klargehalt (V2.5)',
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
