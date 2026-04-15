'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { createClient, createSupabaseClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

type AppRole = 'admin' | 'hr_manager' | 'employee';

type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  primaryEmailAddress: {
    emailAddress: string;
  } | null;
  emailAddresses: Array<{
    emailAddress: string;
  }>;
};

type Organization = {
  id: string;
  name: string | null;
};

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  profile: Profile | null;
  role: AppRole | null;
  organization: Organization | null;
  organizations: Organization[];
  orgId: string | null;
  loading: boolean;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

type MeResponse = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  organizations: Organization[];
  activeOrganizationId: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getOrganizationToken = async () => {
  const response = await fetch('/api/auth/organization-token', {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return (data.token as string | null) ?? null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<MeResponse>({
    isAuthenticated: false,
    user: null,
    organizations: [],
    activeOrganizationId: null,
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const refreshAuth = async () => {
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load auth state');
      }

      const data = (await response.json()) as MeResponse;
      setAuthState(data);
    } catch (error) {
      console.error('Error loading auth state:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        organizations: [],
        activeOrganizationId: null,
      });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    void refreshAuth();
  }, []);

  const activeOrganization =
    authState.organizations.find(({ id }) => id === authState.activeOrganizationId) ?? null;

  const supabase = useMemo<SupabaseClient>(() => {
    if (!authState.isAuthenticated || !activeOrganization?.id) {
      return createClient() as unknown as SupabaseClient;
    }

    return createSupabaseClient(getOrganizationToken) as unknown as SupabaseClient;
  }, [authState.isAuthenticated, activeOrganization?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authState.isAuthenticated || !authState.user) {
      setProfile(null);
      setRole(null);
      setDataLoading(false);
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authState.user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as Profile);
        } else {
          const newProfile = {
            user_id: authState.user.id,
            email: authState.user.primaryEmailAddress?.emailAddress || authState.user.email || '',
            full_name: authState.user.fullName || '',
            organization_id: activeOrganization?.id || null,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'user_id' })
            .select()
            .single();

          if (!createError) {
            setProfile(createdProfile as Profile);
          }
        }

        const roleQuery = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authState.user.id);

        const scopedRoleQuery = activeOrganization?.id
          ? roleQuery.eq('organization_id', activeOrganization.id)
          : roleQuery;

        const { data: roleData } = await scopedRoleQuery.maybeSingle();

        if (roleData) {
          setRole(roleData.role as AppRole);
        } else if (activeOrganization?.id) {
          // No role found but user has an active org — the client-side insert in onboarding
          // may have failed due to JWT-lag. Attempt server-side repair.
          try {
            const res = await fetch('/api/auth/repair-role', { method: 'POST' });
            if (res.ok) {
              const repaired = await res.json() as { role: string };
              setRole(repaired.role as AppRole);
            } else {
              setRole(null);
            }
          } catch {
            setRole(null);
          }
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching global auth data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    void fetchData();
  }, [authLoading, authState.isAuthenticated, authState.user, activeOrganization?.id, supabase]);

  const setActiveOrganization = async (organizationId: string) => {
    const response = await fetch('/api/auth/active-org', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ organizationId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to set active organization');
    }

    await refreshAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isLoaded: !authLoading,
        isSignedIn: authState.isAuthenticated,
        profile,
        role,
        organization: activeOrganization,
        organizations: authState.organizations,
        orgId: activeOrganization?.id || null,
        loading: authLoading || dataLoading,
        supabase,
        signOut: async () => {
          window.location.assign('/auth/sign-out');
        },
        setActiveOrganization,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
