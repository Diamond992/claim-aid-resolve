import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  ensureAuthenticated: () => Promise<boolean>;
  waitForAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing authentication...');
        
        // Set up auth state listener FIRST
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state change:', event, {
              userId: session?.user?.id?.substring(0, 8) + '...',
              hasSession: !!session,
              tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null
            });
            
            if (!mounted) return;

            if (session) {
              // Force JWT synchronization for database operations
              await ensureJWTSync(session);
            }
            
            setSession(session);
            setUser(session?.user ?? null);
            
            // Only set loading to false if this is not the initial load
            if (event !== 'INITIAL_SESSION') {
              setIsLoading(false);
            }

            console.log(session ? '✅ Session synchronized' : '❌ No session');
          }
        );
        
        subscription = authSubscription;

        // THEN check for existing session
        console.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        }

        if (mounted) {
          if (session) {
            console.log('✅ Found existing session');
            await ensureJWTSync(session);
          } else {
            console.log('❌ No existing session found');
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Helper function to ensure JWT is properly synchronized
    const ensureJWTSync = async (session: Session) => {
      try {
        // Test if auth.uid() works in the database
        const { data, error } = await supabase.rpc('get_user_role', { user_id: session.user.id });
        if (error && error.code === 'PGRST116') {
          console.log('🔄 JWT not yet synchronized, waiting...');
          // Wait a bit for JWT to propagate
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn('JWT sync test failed:', error);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Connexion réussie");
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || "Erreur lors de la connexion");
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) throw error;

      toast.success("Inscription réussie. Vérifiez votre email pour confirmer votre compte.");
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || "Erreur lors de l'inscription");
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Supabase signOut warning:', error);
      }
      
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error('Error during signOut:', error);
      toast.success("Déconnexion réussie");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success("Email de récupération envoyé. Vérifiez votre boîte mail.");
      return { error: null };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || "Erreur lors de l'envoi de l'email de récupération");
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Mot de passe mis à jour avec succès");
      return { error: null };
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
      return { error };
    }
  };

  // Ensure user is authenticated and JWT is synchronized
  const ensureAuthenticated = async (): Promise<boolean> => {
    console.log('🔐 Ensuring authentication...');
    
    if (!session || !user) {
      console.log('❌ No session or user found');
      return false;
    }

    try {
      // Test database authentication by calling a simple RPC
      const { error } = await supabase.rpc('get_user_role', { user_id: user.id });
      
      if (error) {
        console.error('❌ Database auth test failed:', error);
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Session refresh failed:', refreshError);
          return false;
        }
        
        console.log('✅ Session refreshed successfully');
        
        // Wait a bit for JWT to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Test again
        const { error: retestError } = await supabase.rpc('get_user_role', { user_id: user.id });
        
        if (retestError) {
          console.error('❌ Database auth still failing after refresh');
          return false;
        }
      }
      
      console.log('✅ Authentication verified');
      return true;
      
    } catch (error) {
      console.error('❌ Authentication verification failed:', error);
      return false;
    }
  };

  // Wait for authentication to be ready
  const waitForAuth = async (maxWaitMs = 5000): Promise<boolean> => {
    console.log('⏳ Waiting for authentication...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (!isLoading && session && user) {
        const isAuthenticated = await ensureAuthenticated();
        if (isAuthenticated) {
          console.log('✅ Authentication ready');
          return true;
        }
      }
      
      // Wait 100ms before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('❌ Authentication timeout');
    return false;
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    ensureAuthenticated,
    waitForAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};