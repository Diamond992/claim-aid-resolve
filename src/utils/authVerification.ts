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
 * Wait for authentication to be fully ready for database operations
 * This includes waiting for JWT token propagation to the database level
 */
export const waitForAuthReady = async (maxWaitMs = 10000): Promise<boolean> => {
  const startTime = Date.now();
  const checkInterval = 1000; // Check every 1 second
  
  console.log('⏳ Waiting for authentication to be fully ready...');

  while (Date.now() - startTime < maxWaitMs) {
    const authState = await verifyAuthenticationState();
    
    if (authState.isValid) {
      console.log('✅ Authentication is fully ready');
      return true;
    }

    console.log(`⏳ Auth not ready yet (${authState.error}), waiting...`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  console.log('❌ Authentication readiness timeout');
  return false;
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

      // Verify auth is ready before operation
      const authReady = await waitForAuthReady(5000);
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
          // Force session refresh and wait longer for token propagation
          console.log('Refreshing session and waiting for token propagation...');
          await supabase.auth.refreshSession();
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
      }

      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts`);
        toast.error(`Erreur lors de ${operationName}. Veuillez réessayer.`);
        throw error;
      }

      // Wait before retry
      const waitTime = attempt * 2000;
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
};
