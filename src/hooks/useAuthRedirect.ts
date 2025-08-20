import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    // Don't redirect while loading auth or role data
    if (authLoading || roleLoading) return;

    // Don't redirect if we're on auth pages
    const authPages = ['/login', '/register', '/password-reset', '/reset-password', '/admin/register'];
    if (authPages.includes(location.pathname)) return;

    // If user is authenticated, redirect based on role
    if (user) {
      // Admins should go to /admin by default, unless they're already on an admin route
      if (isAdmin && !location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
        return;
      }
      
      // Regular users should go to /dashboard by default, unless they're already there or on a user route
      if (!isAdmin && location.pathname === '/') {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate, location.pathname]);

  return { isLoading: authLoading || roleLoading };
};