'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function HomePage() {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (userType === 'admin') {
          router.push('/admin');
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