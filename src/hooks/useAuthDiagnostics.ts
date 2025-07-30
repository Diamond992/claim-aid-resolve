import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthDiagnostics {
  auth_uid: string | null;
  auth_jwt_exists: boolean;
  auth_role: string | null;
  session_user: string;
  current_user: string;
  timestamp: string;
}

export const useAuthDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastDiagnostics, setLastDiagnostics] = useState<AuthDiagnostics | null>(null);

  const runDiagnostics = async (): Promise<AuthDiagnostics | null> => {
    setIsRunning(true);
    
    try {
      console.log('🔍 Running auth diagnostics...');
      
      // Check client-side auth state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Client session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id?.substring(0, 8) + '...' || 'none'
      });

      // Run database diagnostics
      const { data, error } = await supabase.rpc('diagnose_auth_state');
      
      if (error) {
        console.error('❌ Diagnostics error:', error);
        toast.error(`Erreur de diagnostic: ${error.message}`);
        return null;
      }

      const diagnostics = data as unknown as AuthDiagnostics;
      console.log('🔍 Database auth diagnostics:', diagnostics);
      setLastDiagnostics(diagnostics);
      
      // Analyze results
      if (!diagnostics.auth_uid) {
        console.warn('⚠️ AUTH ISSUE: auth.uid() returns null in database');
        toast.warning('Problème détecté: authentification non propagée à la base de données');
      } else {
        console.log('✅ Authentication properly propagated to database');
        toast.success('Authentification correctement propagée');
      }

      return diagnostics;
    } catch (error: any) {
      console.error('❌ Exception during diagnostics:', error);
      toast.error(`Erreur lors du diagnostic: ${error.message}`);
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  return {
    runDiagnostics,
    isRunning,
    lastDiagnostics
  };
};