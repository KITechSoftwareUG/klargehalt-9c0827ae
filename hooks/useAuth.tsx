import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createClient, createClientWithToken } from '@/utils/supabase/client';
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
        let token: string | null = null;
        try {
          token = await session?.getToken({ template: 'supabase', skipCache: true }) || null;
        } catch (tokenError: any) {
          console.error('Clerk Token Error:', tokenError);
        }

        const supabase = createClientWithToken(token);

        // Fetch profile - Filtered by user_id (global/security)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as Profile);
        } else {
          // Create profile if not exists (Client-side sync)
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

        // Fetch role from DB (custom roles) or fallback to Clerk role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData) {
          setRole(roleData.role as AppRole);
        }
      } catch (error) {
        console.error('Error fetching global auth data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isOrgLoaded, isSignedIn, user, session, organization?.id]);

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
