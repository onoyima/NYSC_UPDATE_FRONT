'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';

interface PaymentDetails {
  id: number;
  student_id: number;
  student_name: string;
  matric_number: string;
  email: string;
  phone: string;
  department: string;
  faculty: string;
  level: string;
  amount: number;
  payment_method: 'paystack' | 'bank_transfer' | 'cash';
  payment_status: 'pending' | 'successful' | 'failed' | 'refunded';
  transaction_reference: string;
  gateway_reference?: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
  failure_reason?: string;
  refund_reason?: string;
  refund_date?: string;
  gateway_response?: any;
}

interface PaymentHistory {
  id: number;
  action: string;
  status: string;
  amount?: number;
  reference?: string;
  timestamp: string;
  notes?: string;
  performed_by: string;
}

const PaymentDetailsPage: React.FC = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    const fetchPaymentDetails = async () => {
      try {
        setIsLoadingData(true);
        // Mock data - replace with actual API call
        const mockPayment: PaymentDetails = {
          id: parseInt(paymentId),
          student_id: 1001,
          student_name: 'John Doe',
          matric_number: 'CSC/2019/001',
          email: 'john.doe@university.edu',
          phone: '+234-801-234-5678',
          department: 'Computer Science',
          faculty: 'Science',
          level: '400',
          amount: 50000,
          payment_method: 'paystack',
          payment_status: 'successful',
          transaction_reference: 'TXN_001_2023',
          gateway_reference: 'PSK_001_2023_GATEWAY',
          payment_date: '2023-01-20T14:45:00Z',
          created_at: '2023-01-15T10:30:00Z',
          updated_at: '2023-01-20T14:45:00Z',
          gateway_response: {
            status: 'success',
            gateway_response: 'Approved',
            paid_at: '2023-01-20T14:45:00Z',
            channel: 'card',
            card_type: 'visa',
            bank: 'Access Bank',
            last4: '1234'
          }
        };

        const mockHistory: PaymentHistory[] = [
          {
            id: 1,
            action: 'Payment Initiated',
            status: 'pending',
            amount: 50000,
            reference: 'TXN_001_2023',
            timestamp: '2023-01-15T10:30:00Z',
            notes: 'Student initiated payment via Paystack',
            performed_by: 'System'
          },
          {
            id: 2,
            action: 'Payment Verification',
            status: 'processing',
            timestamp: '2023-01-20T14:40:00Z',
            notes: 'Verifying payment with Paystack gateway',
            performed_by: 'System'
          },
          {
            id: 3,
            action: 'Payment Confirmed',
            status: 'successful',
            amount: 50000,
            reference: 'PSK_001_2023_GATEWAY',
            timestamp: '2023-01-20T14:45:00Z',
            notes: 'Payment successfully processed via Visa card ending in 1234',
            performed_by: 'Paystack Gateway'
          }
        ];
        
        setPayment(mockPayment);
        setPaymentHistory(mockHistory);
      } catch (error) {
        console.error('Error fetching payment details:', error);
        toast.error('Failed to load payment details');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (userType === 'admin' && hasPermission('canViewPayments') && paymentId) {
      fetchPaymentDetails();
    }
  }, [userType, hasPermission, paymentId]);

  const getStatusIcon = (status: PaymentDetails['payment_status']) => {
    switch (status) {
      case 'successful':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'refunded':
        return <ArrowPathIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PaymentDetails['payment_status']) => {
    const configs = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      successful: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${configs[status]}`}>
        {getStatusIcon(status)}
        <span className="ml-2">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getMethodBadge = (method: PaymentDetails['payment_method']) => {
    const configs = {
      paystack: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', label: 'Paystack' },
      bank_transfer: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Bank Transfer' },
      cash: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Cash' }
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${configs[method].bg}`}>
        <CreditCardIcon className="h-4 w-4 mr-2" />
        {configs[method].label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleRefund = async () => {
    if (!payment || payment.payment_status !== 'successful') {
      toast.error('Only successful payments can be refunded');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to refund ${formatCurrency(payment.amount)} to ${payment.student_name}?`
    );

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      // Implement refund logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API call
      toast.success('Refund initiated successfully');
      // Refresh payment data
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!payment || payment.payment_status !== 'failed') {
      toast.error('Only failed payments can be retried');
      return;
    }

    try {
      setIsProcessing(true);
      // Implement retry logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API call
      toast.success('Payment retry initiated');
      // Refresh payment data
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setIsProcessing(false);
    }
  };

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
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Navbar */}
        <Navbar userType="admin" />
        
        <main className="ml-0 md:ml-64 pt-16 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/payments"
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Details
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Transaction ID: {paymentId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : payment ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Payment Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Payment Status Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Payment Status
                    </h2>
                    {getStatusBadge(payment.payment_status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Amount
                      </label>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Payment Method
                      </label>
                      <div className="mt-1">
                        {getMethodBadge(payment.payment_method)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Transaction Reference
                      </label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {payment.transaction_reference}
                        </p>
                        <button
                          onClick={() => copyToClipboard(payment.transaction_reference)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {payment.gateway_reference && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Gateway Reference
                        </label>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-mono text-gray-900 dark:text-white">
                            {payment.gateway_reference}
                          </p>
                          <button
                            onClick={() => copyToClipboard(payment.gateway_reference!)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Payment Date
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Created Date
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    {payment.payment_status === 'successful' && hasPermission('canEditPayments') && (
                      <button
                        onClick={handleRefund}
                        disabled={isProcessing}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                      >
                        {isProcessing ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                        )}
                        Refund Payment
                      </button>
                    )}
                    
                    {payment.payment_status === 'failed' && hasPermission('canEditPayments') && (
                      <button
                        onClick={handleRetryPayment}
                        disabled={isProcessing}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                      >
                        {isProcessing ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                        )}
                        Retry Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Gateway Response */}
                {payment.gateway_response && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Gateway Response
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(payment.gateway_response).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment History */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Payment History
                  </h2>
                  
                  <div className="space-y-4">
                    {paymentHistory.map((history, index) => (
                      <div key={history.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {history.action}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(history.timestamp)}
                            </p>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {history.notes}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            By: {history.performed_by}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Information Sidebar */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Student Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.student_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Full Name
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <IdentificationIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.matric_number}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Matric Number
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email Address
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.phone}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Phone Number
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.department}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Department
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.faculty}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Faculty
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.level} Level
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Academic Level
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      href={`/admin/students/${payment.student_id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      View Student Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Payment Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The payment with ID {paymentId} could not be found.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default PaymentDetailsPage;