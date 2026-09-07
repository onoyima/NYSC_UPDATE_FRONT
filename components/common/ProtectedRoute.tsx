'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isNerdViewerRole } from '@/utils/rolePermissions';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'student' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { isAuthenticated, isLoading, userType: currentUserType, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Nerd-only staff may only ever be on the Nerd records page. Any other
    // route is intercepted and bounced back there.
    if (!isLoading && isAuthenticated && currentUserType === 'admin' && isNerdViewerRole(userRole)) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (path !== '/admin/nerd' && !path.startsWith('/admin/nerd/')) {
        router.replace('/admin/nerd');
        return;
      }
    }

    if (!isLoading && !isAuthenticated) {
      // Only when the page was opened through a shared link (?via=link) should the
      // student be returned here after logging in. Other visits keep the old flow.
      let redirect = '';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('via') === 'link') {
          redirect = window.location.pathname + window.location.search;
        }
      }
      if (redirect) {
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      } else {
        router.push('/login');
      }
      return;
    }

    if (!isLoading && isAuthenticated && userType && currentUserType !== userType) {
      if (currentUserType === 'admin') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    }
  }, [isAuthenticated, isLoading, userType, currentUserType, userRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (userType && currentUserType !== userType) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;