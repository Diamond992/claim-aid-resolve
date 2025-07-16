import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Session validation and recovery utilities
 */

export interface SessionValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  shouldRelogin: boolean;
  error?: string;
}

/**
 * Validate current session and determine recovery strategy
 */
export const validateSession = async (): Promise<SessionValidationResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        isValid: false,
        needsRefresh: false,
        shouldRelogin: true,
        error: error.message
      };
    }
    
    if (!session) {
      return {
        isValid: false,
        needsRefresh: false,
        shouldRelogin: true,
        error: 'No session found'
      };
    }
    
    // Check if token is expired or will expire soon (within 5 minutes)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (expiresAt && expiresAt < now) {
      return {
        isValid: false,
        needsRefresh: true,
        shouldRelogin: false,
        error: 'Session expired'
      };
    }
    
    if (expiresAt && expiresAt < (now + fiveMinutes)) {
      return {
        isValid: true,
        needsRefresh: true,
        shouldRelogin: false,
        error: 'Session expires soon'
      };
    }
    
    return {
      isValid: true,
      needsRefresh: false,
      shouldRelogin: false
    };
    
  } catch (error) {
    return {
      isValid: false,
      needsRefresh: false,
      shouldRelogin: true,
      error: String(error)
    };
  }
};

/**
 * Attempt to recover session
 */
export const recoverSession = async (): Promise<boolean> => {
  try {
    console.log('🔄 Attempting session recovery...');
    
    const validation = await validateSession();
    
    if (validation.shouldRelogin) {
      console.log('❌ Session cannot be recovered - relogin required');
      toast.error('Session expirée. Veuillez vous reconnecter.');
      
      // Clear local storage and redirect to login
      localStorage.clear();
      window.location.href = '/login';
      return false;
    }
    
    if (validation.needsRefresh) {
      console.log('🔄 Refreshing session...');
      
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Session refresh failed:', error);
        toast.error('Impossible de rafraîchir la session. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return false;
      }
      
      // Wait for token propagation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Validate again
      const newValidation = await validateSession();
      if (!newValidation.isValid) {
        console.error('❌ Session still invalid after refresh');
        toast.error('Session non valide. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return false;
      }
      
      console.log('✅ Session refreshed successfully');
      return true;
    }
    
    if (validation.isValid) {
      console.log('✅ Session is valid');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Session recovery failed:', error);
    toast.error('Erreur lors de la récupération de session. Veuillez vous reconnecter.');
    window.location.href = '/login';
    return false;
  }
};

/**
 * Test if database operations work with current session
 */
export const testDatabaseOperations = async (): Promise<boolean> => {
  try {
    // Test 1: Simple select that triggers RLS
    const { error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (selectError && selectError.message.includes('row-level security')) {
      console.log('❌ Database auth test failed - RLS violation');
      return false;
    }
    
    // Test 2: Try to get user role (uses auth.uid())
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      const { error: roleError } = await supabase.rpc('get_user_role', { 
        user_id: session.session.user.id 
      });
      
      if (roleError) {
        console.log('❌ Database auth test failed - function call error:', roleError.message);
        return false;
      }
    }
    
    console.log('✅ Database operations working correctly');
    return true;
    
  } catch (error) {
    console.error('❌ Database operations test failed:', error);
    return false;
  }
};