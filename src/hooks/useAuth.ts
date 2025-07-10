import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Always clear local state first
      setUser(null);
      setSession(null);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Supabase signOut warning:', error);
        // Even if there's an error (like session not found), we still want to redirect
        // This handles cases where the session is already expired
      }
      
      // Always show success message and redirect, regardless of Supabase response
      toast.success("Déconnexion réussie");
      navigate('/login');
    } catch (error) {
      console.error('Error during signOut:', error);
      // Still redirect and show success to user since local state is cleared
      toast.success("Déconnexion réussie");
      navigate('/login');
    }
  };

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

  return {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
};
