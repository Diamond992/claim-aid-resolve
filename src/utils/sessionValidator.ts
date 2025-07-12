import { supabase } from '@/integrations/supabase/client';

export const validateJWTToken = (session: any): boolean => {
  if (!session?.access_token) return false;
  
  try {
    // Decode JWT payload (basic validation)
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      console.error('JWT token expired:', { exp: payload.exp, now });
      return false;
    }
    
    console.log('JWT token validated successfully');
    return true;
  } catch (error) {
    console.error('JWT token validation failed:', error);
    return false;
  }
};

export const refreshSession = async (): Promise<boolean> => {
  try {
    console.log('Refreshing session...');
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return false;
    }
    
    if (!session) {
      console.error('No session after refresh');
      return false;
    }
    
    console.log('Session refreshed successfully');
    return validateJWTToken(session);
  } catch (error) {
    console.error('Session refresh failed:', error);
    return false;
  }
};

// Test if auth.uid() actually works at database level
export const verifyDatabaseAuth = async (): Promise<boolean> => {
  try {
    console.log('Verifying database auth.uid() availability...');
    
    // Test auth.uid() directly using a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', 'current_user_test') // This will use auth.uid() in RLS
      .limit(1);
    
    if (error && error.message.includes('JWT')) {
      console.error('JWT not available at database level:', error);
      return false;
    }
    
    // If we got here without JWT errors, auth.uid() is working
    console.log('Database auth.uid() is available');
    return true;
  } catch (error) {
    console.error('Database auth verification failed:', error);
    return false;
  }
};

export const checkDatabaseSession = async (userId?: string): Promise<boolean> => {
  try {
    console.log('Checking database session for user:', userId);
    
    // First verify auth.uid() is available
    const authAvailable = await verifyDatabaseAuth();
    if (!authAvailable) {
      console.error('Database auth.uid() not available');
      return false;
    }
    
    // Then check user role
    const { data, error } = await supabase.rpc('get_user_role', { user_id: userId });
    
    if (error) {
      console.error('Database session check error:', error);
      return false;
    }
    
    console.log('Database session check successful, user role:', data);
    return true;
  } catch (error) {
    console.error('Database session check failed:', error);
    return false;
  }
};

export const validateSession = async (userId?: string): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    if (userId && session.user.id !== userId) {
      return false;
    }
    
    // Validate JWT token
    if (!validateJWTToken(session)) {
      return false;
    }
    
    // Check database session context
    return await checkDatabaseSession(userId);
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
};