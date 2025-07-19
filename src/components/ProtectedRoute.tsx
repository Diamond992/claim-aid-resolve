
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) {
      console.log('🔄 ProtectedRoute: Still loading auth state');
      return;
    }

    console.log('🔄 ProtectedRoute check:', { 
      requireAuth, 
      hasUser: !!user, 
      path: location.pathname 
    });

    if (requireAuth && !user) {
      // Need auth but no user - redirect to login
      console.log('❌ No auth, redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
      return;
    }

    if (!requireAuth && user) {
      // Don't need auth but have user - redirect to dashboard
      console.log('✅ Already authenticated, checking role for redirect...');
      
      const redirectToDashboard = async () => {
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          const targetPath = roleData?.role === 'admin' ? '/admin' : '/dashboard';
          console.log('🔀 Redirecting to:', targetPath);
          navigate(targetPath, { replace: true });
        } catch (error) {
          console.error('Error checking user role:', error);
          navigate('/dashboard', { replace: true });
        }
      };
      
      redirectToDashboard();
      return;
    }

    console.log('✅ ProtectedRoute: Access granted');
  }, [user, isLoading, requireAuth, redirectTo, navigate, location.pathname]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For auth pages, don't render if user is already authenticated
  if (!requireAuth && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For protected pages, don't render if user is not authenticated
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};
