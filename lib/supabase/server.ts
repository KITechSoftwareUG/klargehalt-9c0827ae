/**
 * Server-side Supabase Client
 * Re-export from utils/supabase/server for consistency
 */

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getOrganizationToken } from '@logto/next/server-actions';
import { getLogtoConfig } from '@/lib/logto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createClient(organizationId?: string | null) {
    const cookieStore = await cookies();
    const activeOrganizationId = organizationId ?? cookieStore.get('kg_active_org')?.value ?? null;
    const organizationToken = activeOrganizationId
        ? await getOrganizationToken(getLogtoConfig(), activeOrganizationId).catch(() => null)
        : null;

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            global: {
                headers: organizationToken
                    ? { Authorization: `Bearer ${organizationToken}` }
                    : {},
            },
        },
    );
}

/**
 * Service-role Supabase client for API routes that have already validated auth
 * via getServerAuthContext(). Bypasses RLS — callers MUST filter by organization_id.
 */
export function createServiceClient() {
    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
