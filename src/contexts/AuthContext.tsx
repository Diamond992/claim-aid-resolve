
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
    console.log('🔄 AuthProvider: Initializing authentication...');
    
    let mounted = true;
    
    // Function to update auth state
    const updateAuthState = (newSession: Session | null) => {
      if (!mounted) return;
      
      console.log('🔄 Updating auth state:', {
        hasSession: !!newSession,
        userId: newSession?.user?.id?.substring(0, 8) + '...' || 'none'
      });
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        updateAuthState(session);
      }
    );

    // Get initial session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          updateAuthState(null);
          return;
        }
        
        console.log('✅ Got initial session:', !!session);
        updateAuthState(session);
        
      } catch (error) {
        console.error('❌ Failed to initialize session:', error);
        updateAuthState(null);
      }
    };

    initializeSession();

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⚠️ Safety timeout: forcing auth ready');
        setIsLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        toast.error(error.message || "Erreur lors de la connexion");
        return { user: null, error };
      }

      if (!data.user) {
        console.error('❌ No user returned from sign in');
        toast.error("Erreur: Aucun utilisateur retourné");
        return { user: null, error: new Error('No user returned') };
      }

      console.log('✅ Sign in successful');
      toast.success("Connexion réussie");
      return { user: data.user, error: null };

    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      toast.error(error.message || "Erreur lors de la connexion");
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
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
      console.log('🔐 Signing out...');
      
      // Clear state immediately
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Sign out warning:', error);
      }
      
      console.log('✅ Sign out successful');
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error('Error during signOut:', error);
      toast.success("Déconnexion réussie");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
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

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
