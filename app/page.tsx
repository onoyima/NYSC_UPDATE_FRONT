'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { SUPER_ADMIN_STAFF_ID } from '@/utils/rolePermissions';
import { AdminUser } from '@/types/auth.types';

export default function HomePage() {
  const { isAuthenticated, userType, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (userType === 'admin') {
          const adminUser = user as AdminUser;
          if (adminUser?.id === SUPER_ADMIN_STAFF_ID) {
            router.push('/admin');
          } else {
            router.push('/staff');
          }
        } else {
          router.push('/student');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, userType, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen animate-fade-in">
      <LoadingSpinner 
        size="xl"
        text="Loading application..."
        className="animate-scale-in"
      />
    </div>
  );
}