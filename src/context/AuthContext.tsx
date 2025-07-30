import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string; // Supabase auth user ID
  employee_id?: number; // ID from the Employee table
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  department?: string; // Mapped from Employee.Team
  position?: string; // Mapped from Employee.Position
  role?: string; // Mapped from Employee.Role
  avatar_url?: string;
  manager_email?: string; // Mapped from Employee."Email.Manager"
  // Budget fields
  budget_dentalglasses?: number;
  budget_medical?: number;
  budget_wedding?: number;
  budget_fitness?: number;
  budget_training?: number;
  // Add other budget fields as needed
}

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid profile email',
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) console.error('Error signing in with Microsoft:', error);
  };

  const signOut = async () => {
    console.log('Starting sign out process...');
    
    try {
      // Clear all auth state first
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Try to sign out from Supabase, but don't wait for it
      supabase.auth.signOut().catch(error => {
        console.warn('Supabase sign out error (non-blocking):', error);
      });
      
      // Force redirect to home page with cache busting
      const timestamp = new Date().getTime();
      window.location.href = `/?_=${timestamp}`;
      
      // Force stop all execution after redirect
      window.stop();
      
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still try to redirect even if there was an error
      window.location.href = '/';
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          
          navigate('/dashboard');
        }

        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        let employeeData = null;
        let error = null;

        // Try fetching by auth_uid first
        if (user.id) {
          const { data, error: authUidError } = await supabase
            .from('Employee')
            .select('*')
            .eq('auth_uid', user.id)
            .single();
          employeeData = data;
          error = authUidError;
        }

        // If not found by auth_uid, try fetching by email_user
        if (!employeeData && user.email) {
          // Use double quotes around column names with dots and escape them properly
          const { data, error: emailError } = await supabase
            .from('Employee')
            .select('*')
            .eq('email_user', user.email)
            .single();
          employeeData = data;
          error = emailError;
        }

        if (error) {
          console.error('Error fetching employee profile:', error.message);
          console.error('Error details:', error);
          setProfile(null);
        } else if (employeeData) {
          console.log('AuthContext - Fetched employeeData:', employeeData);
          console.log('Employee Role from DB:', employeeData.Role);
          console.log('Employee Raw Data:', JSON.stringify(employeeData, null, 2));
          
          // Ensure role is lowercase to match expected values
          const userRole = employeeData.Role?.toLowerCase() || 'employee';
          console.log('Normalized Role:', userRole);
          
          // Access column names with dots using bracket notation
          const newProfile: Profile = {
            id: user.id,
            employee_id: employeeData.id,
            display_name: employeeData.Name,
            first_name: employeeData.Name?.split(' ')[0] || null,
            last_name: employeeData.Name?.split(' ')[1] || null,
            email: employeeData['email_user'] || user.email,
            department: employeeData.Team,
            position: employeeData.Position,
            role: employeeData.Role || userRole, // Try to get Role from employeeData first
            manager_email: employeeData['Email.Manager'],
            avatar_url: user.user_metadata?.avatar_url || null,
            // Budget fields
            budget_dentalglasses: employeeData.budget_dentalglasses,
            budget_medical: employeeData.budget_medical,
            budget_wedding: employeeData.budget_wedding,
            budget_fitness: employeeData.budget_fitness,
            budget_training: employeeData.budget_training,
            // Add other budget fields as needed
          };
          
          console.log('Constructed Profile:', newProfile);
          console.log('AuthContext - Constructed newProfile:', newProfile);
          setProfile(newProfile);
        } else {
          console.warn('No employee profile found for user:', user.id, user.email);
          setProfile(null);
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const value = { session, user, profile, loading, signOut, signInWithMicrosoft, isAuthenticated: !!user };
  // Now profile contains all budget fields, accessible via useAuth().

  if (loading) return <div>Loading Authentication...</div>;
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};