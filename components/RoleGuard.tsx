'use client';

import { useAuth } from '@/hooks/useAuth';

type AppRole = 'admin' | 'hr_manager' | 'employee';

interface RoleGuardProps {
    /** Content is shown only if user has at least one of these roles */
    roles: AppRole[];
    children: React.ReactNode;
    /** Optional fallback shown when access is denied (default: nothing) */
    fallback?: React.ReactNode;
}

/**
 * RoleGuard — declarative role-based access control for UI.
 *
 * NOTE: This is UI-only gating. Real security is enforced by Supabase RLS.
 *
 * Usage:
 *   <RoleGuard roles={['admin', 'hr_manager']}>
 *     <SensitiveComponent />
 *   </RoleGuard>
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
    const { role, loading } = useAuth();

    // While loading, show nothing (avoid flash of forbidden content)
    if (loading) return null;

    // role can be null if not yet set — treat as no access
    if (!role || !roles.includes(role as AppRole)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Hook: check role access imperatively in component logic.
 */
export function useRoleAccess(...roles: AppRole[]) {
    const { role } = useAuth();
    return !!role && roles.includes(role as AppRole);
}
