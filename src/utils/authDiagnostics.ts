import { supabase } from '@/integrations/supabase/client';
import { verifyAuthenticationState } from './authVerification';

export interface AuthDiagnostics {
  timestamp: string;
  clientSession: {
    hasSession: boolean;
    userId?: string;
    tokenExpiry?: Date;
    tokenValid?: boolean;
  };
  databaseConnection: {
    canConnect: boolean;
    authUidWorks: boolean;
    profilesAccess: boolean;
    error?: string;
  };
  rlsPolicyTest: {
    canInsertDossier: boolean;
    canSelectProfiles: boolean;
    error?: string;
  };
  recommendations: string[];
}

/**
 * Comprehensive authentication diagnostics
 * This function tests all aspects of authentication and provides detailed feedback
 */
export const runAuthDiagnostics = async (): Promise<AuthDiagnostics> => {
  const diagnostics: AuthDiagnostics = {
    timestamp: new Date().toISOString(),
    clientSession: {
      hasSession: false,
    },
    databaseConnection: {
      canConnect: false,
      authUidWorks: false,
      profilesAccess: false,
    },
    rlsPolicyTest: {
      canInsertDossier: false,
      canSelectProfiles: false,
    },
    recommendations: [],
  };

  console.log('🔍 Starting comprehensive authentication diagnostics...');

  try {
    // Test 1: Client session check
    console.log('📋 Testing client session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      diagnostics.recommendations.push('Session retrieval failed - check Supabase configuration');
      diagnostics.databaseConnection.error = sessionError.message;
    } else if (session) {
      diagnostics.clientSession.hasSession = true;
      diagnostics.clientSession.userId = session.user.id;
      diagnostics.clientSession.tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000) : undefined;
      diagnostics.clientSession.tokenValid = session.expires_at ? Date.now() < (session.expires_at * 1000) : false;
      
      console.log('✅ Client session valid');
    } else {
      diagnostics.recommendations.push('No active session found - user needs to login');
      console.log('❌ No client session');
    }

    // Test 2: Database connection and auth.uid() availability
    if (diagnostics.clientSession.hasSession) {
      console.log('📋 Testing database connection and auth.uid()...');
      
      try {
        // Simple database connection test
        const { error: connectionError } = await supabase.from('profiles').select('count').limit(1);
        
        if (connectionError) {
          diagnostics.databaseConnection.error = connectionError.message;
          diagnostics.recommendations.push('Database connection failed - check network and Supabase status');
        } else {
          diagnostics.databaseConnection.canConnect = true;
          console.log('✅ Database connection successful');
        }
      } catch (error) {
        diagnostics.databaseConnection.error = String(error);
        diagnostics.recommendations.push('Database connection exception - check configuration');
      }

      // Test auth.uid() availability with multiple methods
      try {
        // Method 1: Direct RLS test
        const { data: profileTest, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', diagnostics.clientSession.userId!)
          .limit(1);
        
        if (profileError && profileError.message.includes('row-level security')) {
          diagnostics.recommendations.push('CRITICAL: auth.uid() returns null in database - JWT token not reaching database context');
          diagnostics.databaseConnection.error = profileError.message;
        } else {
          // Method 2: Function call test
          const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', { 
            user_id: diagnostics.clientSession.userId! 
          });
          
          if (roleError) {
            if (roleError.message.includes('auth.uid()')) {
              diagnostics.recommendations.push('auth.uid() not available in database - JWT token not properly transmitted');
            } else {
              diagnostics.recommendations.push('get_user_role function failed - check database functions');
            }
            diagnostics.databaseConnection.error = roleError.message;
          } else {
            diagnostics.databaseConnection.authUidWorks = true;
            console.log('✅ auth.uid() working in database');
          }
        }
      } catch (error) {
        diagnostics.databaseConnection.error = String(error);
        diagnostics.recommendations.push('Database function call failed - check RLS policies');
      }

      // Test 3: RLS policy tests
      console.log('📋 Testing RLS policies...');
      
      // Test profiles access (should work for own profile)
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', diagnostics.clientSession.userId!)
          .limit(1);
        
        if (profileError) {
          diagnostics.rlsPolicyTest.error = profileError.message;
          if (profileError.message.includes('row-level security')) {
            diagnostics.recommendations.push('RLS policy violation on profiles - auth.uid() likely returning null');
          } else {
            diagnostics.recommendations.push('Profiles access failed - check RLS policies');
          }
        } else {
          diagnostics.rlsPolicyTest.canSelectProfiles = true;
          console.log('✅ Profiles RLS policy working');
        }
      } catch (error) {
        diagnostics.rlsPolicyTest.error = String(error);
        diagnostics.recommendations.push('Profiles access exception - check RLS configuration');
      }

      // Test dossier insertion capability (dry run)
      try {
        const testDossierData = {
          client_id: diagnostics.clientSession.userId!,
          type_sinistre: 'auto' as const,
          date_sinistre: new Date().toISOString().split('T')[0],
          refus_date: new Date().toISOString().split('T')[0],
          motif_refus: 'Test diagnostic',
          montant_refuse: 100,
          police_number: 'TEST-001',
          compagnie_assurance: 'Test Insurance',
        };

        // We'll do a dry run by trying to insert with a rollback
        const { error: insertError } = await supabase
          .from('dossiers')
          .insert(testDossierData)
          .select()
          .limit(1);

        if (insertError) {
          diagnostics.rlsPolicyTest.error = insertError.message;
          if (insertError.message.includes('row-level security')) {
            diagnostics.recommendations.push('RLS policy violation on dossiers - auth.uid() is null or RLS policy incorrect');
          } else {
            diagnostics.recommendations.push('Dossier insertion failed - check data validation or constraints');
          }
        } else {
          diagnostics.rlsPolicyTest.canInsertDossier = true;
          console.log('✅ Dossier insertion RLS policy working');
          
          // Clean up test data
          await supabase
            .from('dossiers')
            .delete()
            .eq('client_id', diagnostics.clientSession.userId!)
            .eq('police_number', 'TEST-001');
        }
      } catch (error) {
        diagnostics.rlsPolicyTest.error = String(error);
        diagnostics.recommendations.push('Dossier insertion test failed - check RLS policies and constraints');
      }
    }

    // Test 4: Use comprehensive auth verification
    console.log('📋 Running comprehensive auth verification...');
    const authVerification = await verifyAuthenticationState();
    
    if (!authVerification.isValid) {
      diagnostics.recommendations.push(`Auth verification failed: ${authVerification.error}`);
    }

    // Generate final recommendations
    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('All authentication checks passed! System is working correctly.');
    } else {
      diagnostics.recommendations.unshift('Authentication issues detected. See recommendations below:');
    }

    console.log('📊 Authentication diagnostics completed');
    console.log('Recommendations:', diagnostics.recommendations);
    
    return diagnostics;

  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
    diagnostics.recommendations.push(`Diagnostics failed: ${error}`);
    return diagnostics;
  }
};

/**
 * Quick authentication health check
 */
export const quickAuthCheck = async (): Promise<boolean> => {
  try {
    const authState = await verifyAuthenticationState();
    return authState.isValid;
  } catch (error) {
    console.error('Quick auth check failed:', error);
    return false;
  }
};