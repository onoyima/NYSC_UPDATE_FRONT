'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import studentService from '@/services/student.service';
import { toast } from 'sonner';
import { CreditCard, Download, Eye, Calendar, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';

interface PaymentRecord {
  id: number;
  reference: string;
  amount: number;
  status: string;
  payment_date: string;
  created_at: string;
  transaction_id: string;
  student_nysc: {
    full_name: string;
    matric_number: string;
    username: string;
  } | null;
}

interface ReceiptData {
  payment: {
    id: number;
    reference: string;
    amount: number;
    status: string;
    payment_date: string;
    transaction_id: string;
  };
  student: {
    full_name: string;
    matric_number: string;
    username: string;
    email: string;
    phone?: string;
    institution: string;
    course_of_study: string;
    year_of_graduation: string;
    state?: string;
    lga?: string;
  } | null;
  receipt_generated_at: string;
}

const PaymentHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await studentService.getPaymentHistory();
      setPayments(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReceipt = async (paymentId: number) => {
    try {
      const response = await studentService.getPaymentReceipt(paymentId.toString());
      setSelectedReceipt(response.data.data);
      setShowReceiptModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch receipt');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return <Badge className="bg-green-100 text-green-800">Successful</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <Sidebar />
          <div className="flex">
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 overflow-y-auto h-screen pt-20">
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner 
                  size="xl" 
                  text="Loading payment history..." 
                  className="animate-fade-in"
                />
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <div className="flex">
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 overflow-y-auto h-screen pt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Payment History</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  View your student details update payment history and download receipts
                </p>
              </div>

              {payments.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't made any payments yet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment, index) => (
                    <Card 
                      key={payment.id} 
                      className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-4 sm:p-6">
                        {/* Mobile-first responsive layout */}
                        <div className="space-y-4">
                          {/* Header section with icon and title */}
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg truncate">
                                Payment #{payment.reference}
                              </h3>
                              {payment.student_nysc && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {payment.student_nysc.full_name} - {payment.student_nysc.matric_number}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Payment details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(payment.payment_date || payment.created_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </div>

                          {/* Status and actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center">
                              {getStatusBadge(payment.status)}
                            </div>
                            {payment.status.toLowerCase() === 'successful' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReceipt(payment.id)}
                                className="flex items-center justify-center w-full sm:w-auto"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Receipt
                              </Button>
                            )}
                          </div>

                          {/* Transaction ID */}
                          {payment.transaction_id && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-muted-foreground break-all">
                                Transaction ID: {payment.transaction_id}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Receipt Modal */}
        {showReceiptModal && selectedReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible transform animate-scale-in shadow-2xl">
              <div className="p-4 sm:p-6 print:p-8">
                {/* Receipt Header with Logo */}
                <div className="text-center mb-6 sm:mb-8 print:mb-12">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative">
                      <Image
                        src="/logo.png"
                        alt="NYSC Logo"
                        width={80}
                        height={80}
                        className="object-contain drop-shadow-md"
                        priority
                      />
                    </div>
                  </div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Details Update Payment Receipt</h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Official Payment Confirmation</p>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mt-3 rounded-full"></div>
                </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Payment Information</h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                      <span className="font-medium text-gray-900 dark:text-white break-all">{selectedReceipt.payment.reference}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedReceipt.payment.amount)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{selectedReceipt.payment.status}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 dark:text-gray-400">Payment Date:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(selectedReceipt.payment.payment_date), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    {selectedReceipt.payment.transaction_id && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                        <span className="font-medium text-xs text-gray-900 dark:text-white break-all">{selectedReceipt.payment.transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedReceipt.student && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Student Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
                        <span className="font-medium text-gray-900 dark:text-white break-words">{selectedReceipt.student.full_name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Matric Number:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedReceipt.student.matric_number}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Username:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedReceipt.student.username}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-white break-all">{selectedReceipt.student.email}</span>
                      </div>
                      {selectedReceipt.student.phone && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedReceipt.student.phone}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Institution:</span>
                        <span className="font-medium text-gray-900 dark:text-white break-words">{selectedReceipt.student.institution}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Course of Study:</span>
                        <span className="font-medium text-gray-900 dark:text-white break-words">{selectedReceipt.student.course_of_study}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-600 dark:text-gray-400">Year of Graduation:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedReceipt.student.year_of_graduation}</span>
                      </div>
                      {selectedReceipt.student.state && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 dark:text-gray-400">State:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedReceipt.student.state}</span>
                        </div>
                      )}
                      {selectedReceipt.student.lga && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 dark:text-gray-400">LGA:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedReceipt.student.lga}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <p>This is an official receipt for student details update payment.</p>
                <p className="mt-2">
                  Generated on: {format(new Date(selectedReceipt.receipt_generated_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 print:hidden">
                <Button
                  variant="outline"
                  onClick={() => setShowReceiptModal(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  onClick={handlePrintReceipt}
                  className="flex items-center justify-center w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default PaymentHistoryPage;