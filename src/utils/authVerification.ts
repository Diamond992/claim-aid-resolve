import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthVerificationResult {
  isValid: boolean;
  hasValidSession: boolean;
  hasValidJWT: boolean;
  isDatabaseAuth: boolean;
  userId?: string;
  error?: string;
}

/**
 * Comprehensive authentication verification that tests all levels:
 * 1. Client session validity
 * 2. JWT token validity  
 * 3. Database-level auth.uid() availability
 */
export const verifyAuthenticationState = async (): Promise<AuthVerificationResult> => {
  const result: AuthVerificationResult = {
    isValid: false,
    hasValidSession: false,
    hasValidJWT: false,
    isDatabaseAuth: false
  };

  try {
    console.log('🔍 Starting comprehensive auth verification...');

    // Step 1: Check client session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      result.error = 'No valid session found';
      console.log('❌ Session check failed:', sessionError?.message || 'No session');
      return result;
    }

    result.hasValidSession = true;
    result.userId = session.user.id;
    console.log('✅ Valid session found for user:', session.user.id);

    // Step 2: Verify JWT token structure and expiry
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        result.error = 'JWT token expired';
        console.log('❌ JWT token expired');
        return result;
      }

      result.hasValidJWT = true;
      console.log('✅ JWT token is valid');
    } catch (error) {
      result.error = 'Invalid JWT token format';
      console.log('❌ JWT token validation failed:', error);
      return result;
    }

    // Step 3: Test database-level auth.uid() availability
    try {
      console.log('🔍 Testing database auth.uid() availability...');
      
      // Use a simple query that will trigger RLS and thus auth.uid()
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .limit(1);

      if (dbError) {
        if (dbError.message.includes('JWT') || dbError.message.includes('auth')) {
          result.error = `Database auth not available: ${dbError.message}`;
          console.log('❌ Database auth.uid() not available:', dbError.message);
          return result;
        }
        // Other errors might be expected (like no matching rows), which is fine
      }

      result.isDatabaseAuth = true;
      console.log('✅ Database auth.uid() is available');
    } catch (error) {
      result.error = `Database auth test failed: ${error}`;
      console.log('❌ Database auth test error:', error);
      return result;
    }

    // All checks passed
    result.isValid = true;
    console.log('🎉 All auth checks passed successfully');
    
    return result;

  } catch (error) {
    result.error = `Verification failed: ${error}`;
    console.error('❌ Auth verification error:', error);
    return result;
  }
};

/**
 * Test database authentication context explicitly
 */
export const testDatabaseAuth = async (): Promise<{ success: boolean; authUid: string | null; error?: string }> => {
  try {
    // Direct test of auth.uid() in database context
    const { data, error } = await supabase.rpc('get_user_role', { user_id: 'test' });
    
    if (error) {
      // If the function fails, auth.uid() is likely null
      return { success: false, authUid: null, error: error.message };
    }
    
    // Get the actual auth.uid() value from database
    const { data: authData, error: authError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (authError && authError.message.includes('row-level security')) {
      return { success: false, authUid: null, error: 'RLS policy violation - auth.uid() is null' };
    }
    
    return { success: true, authUid: 'available' };
  } catch (error) {
    return { success: false, authUid: null, error: String(error) };
  }
};

/**
 * Enhanced wait for authentication with explicit database testing
 */
export const waitForAuthReady = async (maxWaitMs = 15000): Promise<boolean> => {
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds for longer propagation time
  
  console.log('⏳ Waiting for authentication to be fully ready...');

  while (Date.now() - startTime < maxWaitMs) {
    // First check client-side auth
    const authState = await verifyAuthenticationState();
    
    if (authState.isValid) {
      // Then test database auth explicitly
      const dbAuthTest = await testDatabaseAuth();
      
      if (dbAuthTest.success) {
        console.log('✅ Authentication is fully ready');
        return true;
      } else {
        console.log(`⏳ Database auth not ready: ${dbAuthTest.error}`);
      }
    } else {
      console.log(`⏳ Client auth not ready yet (${authState.error}), waiting...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  console.log('❌ Authentication readiness timeout');
  return false;
};

/**
 * Force complete authentication cycle
 */
export const forceAuthRefresh = async (): Promise<boolean> => {
  try {
    console.log('🔄 Forcing complete authentication refresh...');
    
    // Step 1: Refresh session
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('❌ Session refresh failed:', error);
      return false;
    }
    
    if (!data.session) {
      console.error('❌ No session after refresh');
      return false;
    }
    
    // Step 2: Wait for token propagation (longer wait time)
    console.log('⏳ Waiting for token propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 3: Test database auth
    const dbTest = await testDatabaseAuth();
    if (dbTest.success) {
      console.log('✅ Auth refresh successful');
      return true;
    } else {
      console.log('❌ Auth refresh failed:', dbTest.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Force auth refresh failed:', error);
    return false;
  }
};

/**
 * Enhanced authentication retry logic for database operations
 */
export const executeWithAuthRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3
): Promise<T | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} - Attempt ${attempt}/${maxRetries}`);

      // Verify auth is ready before operation with longer wait time
      const authReady = await waitForAuthReady(10000);
      if (!authReady) {
        if (attempt === maxRetries) {
          toast.error('Authentification non disponible. Veuillez vous reconnecter.');
          return null;
        }
        console.log('Auth not ready, will retry...');
        continue;
      }

      // Execute the operation
      const result = await operation();
      console.log(`✅ ${operationName} completed successfully`);
      return result;

    } catch (error: any) {
      console.error(`❌ ${operationName} failed on attempt ${attempt}:`, error);

      if (error.message?.includes('row-level security policy')) {
        console.log('🔒 RLS policy violation detected - auth.uid() likely null');
        
        if (attempt < maxRetries) {
          // Force complete auth refresh with longer wait
          console.log('Forcing complete authentication refresh...');
          const refreshSuccess = await forceAuthRefresh();
          
          if (!refreshSuccess) {
            // If refresh fails, wait even longer before retry
            console.log('⏳ Auth refresh failed, waiting longer before retry...');
            await new Promise(resolve => setTimeout(resolve, 8000));
          }
          
          continue;
        } else {
          // Final attempt failed - provide specific error
          console.error('❌ RLS policy violation persists after all retries');
          toast.error('Problème d\'authentification persistant. Veuillez vous reconnecter.');
          return null;
        }
      }

      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts`);
        
        // Provide specific error messages
        if (error.code === '42501') {
          toast.error('Erreur d\'autorisation. Veuillez vous reconnecter.');
        } else if (error.message?.includes('JWT')) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
        } else {
          toast.error(`Erreur lors de ${operationName}. Veuillez réessayer.`);
        }
        
        throw error;
      }

      // Wait before retry with exponential backoff
      const waitTime = attempt * 3000;
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
};
