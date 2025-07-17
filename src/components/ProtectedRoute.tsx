import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔄 ProtectedRoute effect:', { isLoading, user: !!user, requireAuth });
    
    if (!isLoading) {
      if (requireAuth && !user) {
        console.log('User not authenticated, redirecting to:', redirectTo);
        navigate(redirectTo);
      } else if (!requireAuth && user) {
        // Redirect authenticated users to appropriate dashboard
        console.log('User already authenticated, redirecting to dashboard...');
        
        // Check user role for proper redirection
        const checkUserRole = async () => {
          try {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .single();
            
            if (roleData?.role === 'admin') {
              console.log('🔀 Redirecting admin to /admin');
              navigate('/admin');
            } else {
              console.log('🔀 Redirecting user to /dashboard');
              navigate('/dashboard');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            navigate('/dashboard');
          }
        };
        
        checkUserRole();
      }
    }
  }, [user, isLoading, requireAuth, redirectTo, navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For auth routes, don't render if user is authenticated
  if (!requireAuth && user) {
    return null;
  }

  // For protected routes, don't render if user is not authenticated
  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
};