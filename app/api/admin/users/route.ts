import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';

const SUPER_ADMIN_USER_ID = 'zqf0ih9ji1m1'; // aalkh

async function getLogtoM2MToken(): Promise<string> {
    const res = await fetch(`${process.env.LOGTO_ENDPOINT}/oidc/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.LOGTO_M2M_APP_ID!,
            client_secret: process.env.LOGTO_M2M_APP_SECRET!,
            resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE!,
            scope: 'all',
        }),
    });
    const data = await res.json() as { access_token: string };
    return data.access_token;
}

interface LogtoUser {
    id: string;
    username: string | null;
    primaryEmail: string | null;
    name: string | null;
    lastSignInAt: number | null;
    createdAt: number;
    isSuspended: boolean;
}

interface SupabaseProfile {
    user_id: string;
    email: string;
    full_name: string | null;
}

interface UserRole {
    user_id: string;
    role: string;
    organization_id: string | null;
}

interface Company {
    organization_id: string;
    name: string;
    subscription_tier: string | null;
    subscription_status: string | null;
    trial_ends_at: string | null;
}

export interface AdminUser {
    id: string;
    email: string | null;
    username: string | null;
    name: string | null;
    lastSignInAt: string | null;
    createdAt: string;
    isSuspended: boolean;
    role: string | null;
    company: string | null;
    subscriptionTier: string | null;
    subscriptionStatus: string | null;
    trialEndsAt: string | null;
    organizationId: string | null;
}

export async function GET() {
    const auth = await getServerAuthContext();
    if (!auth?.user || auth.user.id !== SUPER_ADMIN_USER_ID) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const token = await getLogtoM2MToken();

    // Fetch all Logto users
    const logtoRes = await fetch(`${process.env.LOGTO_ENDPOINT}/api/users?pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const logtoUsers = await logtoRes.json() as LogtoUser[];

    // Fetch Supabase data in parallel
    const [profilesRes, rolesRes, companiesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, email, full_name'),
        supabase.from('user_roles').select('user_id, role, organization_id'),
        supabase.from('companies').select('organization_id, name, subscription_tier, subscription_status, trial_ends_at'),
    ]);

    const profiles: SupabaseProfile[] = profilesRes.data ?? [];
    const roles: UserRole[] = rolesRes.data ?? [];
    const companies: Company[] = companiesRes.data ?? [];

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));
    const roleMap = new Map(roles.map(r => [r.user_id, r]));
    const companyMap = new Map(companies.map(c => [c.organization_id, c]));

    const users: AdminUser[] = logtoUsers.map((u) => {
        const profile = profileMap.get(u.id);
        const userRole = roleMap.get(u.id);
        const company = userRole?.organization_id ? companyMap.get(userRole.organization_id) : undefined;

        return {
            id: u.id,
            email: u.primaryEmail ?? profile?.email ?? null,
            username: u.username,
            name: u.name ?? profile?.full_name ?? null,
            lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
            createdAt: new Date(u.createdAt).toISOString(),
            isSuspended: u.isSuspended,
            role: userRole?.role ?? null,
            company: company?.name ?? null,
            subscriptionTier: company?.subscription_tier ?? null,
            subscriptionStatus: company?.subscription_status ?? null,
            trialEndsAt: company?.trial_ends_at ?? null,
            organizationId: userRole?.organization_id ?? null,
        };
    });

    return NextResponse.json(users);
}
