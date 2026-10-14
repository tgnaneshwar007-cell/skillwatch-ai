import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_PROFILES } from '../lib/mockData';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(DEMO_PROFILES[0]); // default to National Admin in demo mode
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch associated profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile as Profile);
            } else {
              // Fallback user if profile row hasn't synced
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'Authorized Official',
                role: (session.user.user_metadata?.role as UserRole) || 'district_officer',
                created_at: new Date().toISOString(),
              });
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Error fetching Supabase auth session:', err);
          setUser(null);
        }
      } else {
        // Read stored demo role if any
        const storedRoleId = localStorage.getItem('skillwatch_demo_user_id');
        const matched = DEMO_PROFILES.find(p => p.id === storedRoleId);
        setUser(matched || DEMO_PROFILES[0]);
      }
      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as Profile);
          }
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (!password) {
          setIsLoading(false);
          return { success: false, error: 'Password is required for Supabase authentication.' };
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          setUser(profile as Profile);
          setIsLoading(false);
          return { success: true };
        }
      }

      // Demo login validation
      const matched = DEMO_PROFILES.find(
        p => p.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (matched) {
        setUser(matched);
        localStorage.setItem('skillwatch_demo_user_id', matched.id);
        setIsLoading(false);
        return { success: true };
      }

      // Default demo login if password provided or matched
      const fallbackUser: Profile = {
        id: `usr-custom-${Date.now()}`,
        email: email.trim(),
        full_name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        role: 'district_officer',
        assigned_district: 'Jaipur',
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('skillwatch_demo_user_id');
    setUser(null);
  };

  const switchDemoRole = (targetRole: UserRole) => {
    const matched = DEMO_PROFILES.find(p => p.role === targetRole);
    if (matched) {
      setUser(matched);
      localStorage.setItem('skillwatch_demo_user_id', matched.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'district_officer',
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        switchDemoRole,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
