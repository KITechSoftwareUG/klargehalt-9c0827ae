import { useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Permission {
  code: string;
  name: string;
  category: string;
}

// Permission codes for type safety
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',

  // Company
  COMPANY_VIEW: 'company.view',
  COMPANY_UPDATE: 'company.update',
  COMPANY_SETTINGS: 'company.settings',

  // Job Profiles
  JOB_PROFILES_VIEW: 'job_profiles.view',
  JOB_PROFILES_CREATE: 'job_profiles.create',
  JOB_PROFILES_UPDATE: 'job_profiles.update',
  JOB_PROFILES_DELETE: 'job_profiles.delete',

  // Pay Bands
  PAY_BANDS_VIEW: 'pay_bands.view',
  PAY_BANDS_CREATE: 'pay_bands.create',
  PAY_BANDS_UPDATE: 'pay_bands.update',
  PAY_BANDS_DELETE: 'pay_bands.delete',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',
  EMPLOYEES_VIEW_OWN: 'employees.view_own',

  // Salaries
  SALARIES_VIEW: 'salaries.view',
  SALARIES_CREATE: 'salaries.create',
  SALARIES_UPDATE: 'salaries.update',
  SALARIES_VIEW_AGGREGATED: 'salaries.view_aggregated',

  // Audit
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',

  // Requests
  REQUESTS_CREATE: 'requests.create',
  REQUESTS_VIEW_OWN: 'requests.view_own',
  REQUESTS_VIEW_ALL: 'requests.view_all',
  REQUESTS_PROCESS: 'requests.process',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

type AppRole = 'admin' | 'hr_manager' | 'employee';

// Static role → permission mapping. RLS is the real security boundary;
// this is purely for UI gating.
const ROLE_PERMISSION_MAP: Record<AppRole, PermissionCode[]> = {
  admin: Object.values(PERMISSIONS),
  hr_manager: [
    'users.view',
    'company.view',
    'company.update',
    'job_profiles.view', 'job_profiles.create', 'job_profiles.update', 'job_profiles.delete',
    'pay_bands.view', 'pay_bands.create', 'pay_bands.update', 'pay_bands.delete',
    'employees.view', 'employees.create', 'employees.update', 'employees.delete', 'employees.view_own',
    'salaries.view', 'salaries.create', 'salaries.update', 'salaries.view_aggregated',
    'audit.view', 'audit.export',
    'reports.view', 'reports.create', 'reports.export',
    'requests.view_all', 'requests.process', 'requests.create', 'requests.view_own',
  ],
  employee: [
    'company.view',
    'job_profiles.view',
    'pay_bands.view',
    'employees.view_own',
    'salaries.view_aggregated',
    'requests.create',
    'requests.view_own',
  ],
};

export function usePermissions() {
  const { role, loading: authLoading } = useAuth();

  const effectiveRole: AppRole = (role as AppRole) ?? 'employee';

  const permissionCodes = useMemo<Set<string>>(
    () => new Set(ROLE_PERMISSION_MAP[effectiveRole] ?? ROLE_PERMISSION_MAP.employee),
    [effectiveRole]
  );

  const permissions = useMemo<Permission[]>(
    () => Array.from(permissionCodes).map(code => {
      const [category, action] = code.split('.');
      return { code, name: action, category };
    }),
    [permissionCodes]
  );

  const hasPermission = useCallback(
    (code: PermissionCode | string): boolean => permissionCodes.has(code),
    [permissionCodes]
  );

  const hasAnyPermission = useCallback(
    (codes: (PermissionCode | string)[]): boolean => codes.some(c => permissionCodes.has(c)),
    [permissionCodes]
  );

  const hasAllPermissions = useCallback(
    (codes: (PermissionCode | string)[]): boolean => codes.every(c => permissionCodes.has(c)),
    [permissionCodes]
  );

  const getPermissionsByCategory = useCallback(
    (category: string): Permission[] => permissions.filter(p => p.category === category),
    [permissions]
  );

  return {
    permissions,
    loading: authLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByCategory,
    refetch: () => {}, // no-op — permissions derived from role, no fetch needed
  };
}

/**
 * Role labels for display
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr_manager: 'HR-Manager',
  employee: 'Mitarbeiter',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Vollzugriff auf alle Funktionen und Einstellungen',
  hr_manager: 'Verwaltung von Mitarbeitern, Gehältern und Job-Profilen',
  employee: 'Einsicht in eigene Daten und Auskunftsanfragen',
};

/**
 * Role colors for UI
 */
export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-status-action/10 text-status-action',
  hr_manager: 'bg-status-warning/10 text-status-warning',
  employee: 'bg-status-ok/10 text-status-ok',
};
