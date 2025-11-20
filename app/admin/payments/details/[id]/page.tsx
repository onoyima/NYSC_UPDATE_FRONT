'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';
import { PaymentRecord } from '@/types/admin.types';

const PaymentDetailsPage: React.FC = () => {
  const { userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const paymentIdParam = params.id as string;
  const paymentId = Number(paymentIdParam);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }
      if (!hasPermission('canViewPayments')) {
        toast.error('You do not have permission to access this page');
        router.push('/admin');
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingData(true);
        if (!Number.isFinite(paymentId) || isNaN(paymentId)) {
          toast.error('Invalid payment id');
          router.push('/admin/payments');
          return;
        }
        const data = await adminService.getPaymentDetails(paymentId);
        setPayment((data as any).payment || data);
      } catch (e) {
        toast.error('Failed to load payment details');
        router.push('/admin/payments');
      } finally {
        setLoadingData(false);
      }
    };
    if (userType === 'admin' && hasPermission('canViewPayments')) {
      run();
    }
  }, [userType, hasPermission, paymentId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userType !== 'admin') {
    return null;
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Details</h1>
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : payment ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
                    <p className="text-lg text-gray-900 dark:text-white">{payment.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="text-lg text-gray-900 dark:text-white">{payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-lg text-gray-900 dark:text-white">{payment.payment_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                    <p className="text-lg text-gray-900 dark:text-white">{payment.payment_method}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400">No payment details</div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PaymentDetailsPage;