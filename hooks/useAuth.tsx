import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createClient, createClientWithToken } from '@/utils/supabase/client';
import { useUser, useClerk, useSession } from '@clerk/nextjs';

type AppRole = 'admin' | 'hr_manager' | 'employee';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: any; // Using any for compatibility or explicit Clerk UserResource
  isLoaded: boolean;
  isSignedIn: boolean;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean; // Computed combined loading state
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const { session } = useSession(); // Add this at top level of component

  useEffect(() => {
    if (!isLoaded) return;
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
          // Get JWT from Clerk for Supabase
          // Ensure you have created a JWT Template named 'supabase' in Clerk Dashboard
          token = await session?.getToken({ template: 'supabase' }) || null;
        } catch (tokenError: any) {
          // console.error('CLERK CONFIGURATION ERROR: Failed to retrieve Supabase token. Ensure a JWT Template named "supabase" is created in Clerk Dashboard.', JSON.stringify(tokenError, null, 2), tokenError);
          // We continue without a token, which might mean RLS failure, but prevents runtime crash.
        }

        // Use authenticated client (or anon if token failed)
        const supabase = createClientWithToken(token);

        // Fetch profile
        const { data: profileData, error } = await supabase
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
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
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
        }
      } catch (error) {
        console.error('Error fetching profile/role:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isSignedIn, user, session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!isSignedIn,
        profile,
        role,
        loading: !isLoaded || dataLoading,
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
