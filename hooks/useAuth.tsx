import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser, useClerk } from '@clerk/nextjs';

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
      const supabase = createClient();
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as Profile);
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
  }, [isLoaded, isSignedIn, user]);

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
