import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import { createClient, createSupabaseClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useUser, useClerk, useSession, useOrganization } from '@clerk/nextjs';

type AppRole = 'admin' | 'hr_manager' | 'employee';

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
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  profile: Profile | null;
  role: AppRole | null;
  organization: any;
  orgId: string | null;
  loading: boolean;
  supabase: SupabaseClient; // ← The single, smart, token-aware client
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const { session } = useSession();

  /**
   * The single Supabase client for the entire app.
   * Uses the fetch interceptor pattern: a fresh Clerk JWT is injected
   * at network-request time, not at render time.
   * Recreated only when the session changes.
   */
  const supabase = useMemo<SupabaseClient>(() => {
    if (!session) {
      // No session yet — return anon client (will fail RLS, but avoids null)
      return createClient() as unknown as SupabaseClient;
    }
    return createSupabaseClient(
      () => session.getToken({ template: 'supabase' }) as Promise<string | null>
    ) as unknown as SupabaseClient;
  }, [session]);

  useEffect(() => {
    if (!isLoaded || !isOrgLoaded) return;
    if (!isSignedIn || !user) {
      setProfile(null);
      setRole(null);
      setDataLoading(false);
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as Profile);
        } else {
          // Create profile if not exists
          const newProfile = {
            user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            full_name: user.fullName || '',
            organization_id: organization?.id || null
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

        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData) {
          setRole(roleData.role as AppRole);
        } else {
          // No role assigned yet — default to 'employee'.
          // The first user who onboards (completes org setup) gets 'admin' via the onboarding page.
          // Everyone else who signs up into an existing org defaults to 'employee'.
          console.log('[Auth] No role found for user, defaulting to employee');
          setRole('employee');
          // Persist the default so subsequent loads are fast
          await supabase
            .from('user_roles')
            .upsert({ user_id: user.id, role: 'employee' }, { onConflict: 'user_id' })
            .select();
        }
      } catch (error) {
        console.error('Error fetching global auth data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isOrgLoaded, isSignedIn, user, supabase, organization?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded: isLoaded && isOrgLoaded,
        isSignedIn: !!isSignedIn,
        profile,
        role,
        organization,
        orgId: organization?.id || null,
        loading: !isLoaded || !isOrgLoaded || dataLoading,
        supabase,
        signOut: async () => await signOut()
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
