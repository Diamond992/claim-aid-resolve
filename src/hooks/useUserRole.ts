
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/user-roles";

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Utiliser la fonction RPC pour obtenir le rôle
        const { data: role, error } = await supabase.rpc('get_user_role');

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Valeur par défaut
        } else {
          setUserRole((role as UserRole) || 'user');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  return {
    userRole,
    isAdmin,
    isSuperAdmin,
    isLoading
  };
};
