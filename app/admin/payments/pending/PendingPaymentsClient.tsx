'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Link from 'next/link';
import adminService from '@/services/admin.service';
import { PaymentRecord } from '@/types/admin.types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PendingPaymentsClient: React.FC = () => {
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const { user, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !userType || userType !== 'admin') {
      router.push('/');
      return;
    }
    fetchPendingPayments();
  }, [user, userType, router, currentPage]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getPendingPayments(currentPage);

      // Debug the response structure
      console.log('Pending payments response:', response);

      // Ensure pendingPayments is always an array of valid payment objects
      let validPayments: PaymentRecord[] = [];

      if (response && response.payments) {
        if (typeof response.payments === 'object' && response.payments !== null) {
          // Check if response.payments has a data property that is an array
          const paymentsData = 'data' in response.payments && Array.isArray(response.payments.data) 
            ? response.payments.data 
            : Array.isArray(response.payments) ? response.payments : [];
          
          validPayments = paymentsData.filter(p => p && p.id !== undefined);
          
          // Handle pagination data
          setTotalPages('last_page' in response.payments && response.payments.last_page !== undefined 
            ? Number(response.payments.last_page) 
            : response.totalPages || 1);
            
          setTotalItems('total' in response.payments && response.payments.total !== undefined 
            ? Number(response.payments.total) 
            : response.total || paymentsData.length);
        } else if (Array.isArray(response.payments)) {
          // If payments is directly an array
          validPayments = (response.payments as PaymentRecord[]).filter(p => p && p.id !== undefined);
          setTotalPages(response.totalPages || 1);
          setTotalItems(response.total || (response.payments as PaymentRecord[]).length);
        }
      } else if (Array.isArray(response)) {
        // If the response itself is an array
        validPayments = response.filter(p => p && p.id !== undefined);
        setTotalPages(1);
        setTotalItems(response.length);
      } else {
        console.error('Unexpected response format:', response);
        validPayments = [];
        setTotalPages(1);
        setTotalItems(0);
      }

      // Log any invalid payments that were filtered out
      let paymentsArray: PaymentRecord[] = [];
      
      if (response && response.payments) {
        if (typeof response.payments === 'object' && response.payments !== null) {
          if ('data' in response.payments && Array.isArray(response.payments.data)) {
            paymentsArray = response.payments.data as PaymentRecord[];
          } else if (Array.isArray(response.payments)) {
            paymentsArray = response.payments as PaymentRecord[];
          }
        } else if (Array.isArray(response.payments)) {
          paymentsArray = response.payments as PaymentRecord[];
        }
      } else if (Array.isArray(response)) {
        paymentsArray = response as PaymentRecord[];
      }
      
      const invalidCount = paymentsArray.length - validPayments.length;
      if (invalidCount > 0) {
        console.warn(`Filtered out ${invalidCount} invalid payment records`);
      }

      setPendingPayments(validPayments);
    } catch (err) {
      console.error('Error fetching pending payments:', err);
      setError('Failed to load pending payments. Please try again.');
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAll = async () => {
    try {
      setLoading(true);
      await adminService.verifyAllPendingPayments();
      toast.success('All pending payments have been verified');
      fetchPendingPayments();
    } catch (err) {
      console.error('Error verifying all payments:', err);
      toast.error('Failed to verify all payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading && pendingPayments.length === 0) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pending Payments</h1>
          <Button
            onClick={handleVerifyAll}
            disabled={loading || pendingPayments.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Verify All Pending Payments'
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>
              {totalItems} payment{totalItems !== 1 ? 's' : ''} pending verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            {pendingPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending payments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => {
                      // We've already filtered out payments without IDs, but add an extra safety check
                      if (!payment || payment.id === undefined) {
                        return null;
                      }

                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.id}</TableCell>
                          <TableCell>{payment.student_name || 'Unknown'}</TableCell>
                          <TableCell>{formatCurrency(payment.amount || 0)}</TableCell>
                          <TableCell>{formatDate(payment.created_at || new Date().toISOString())}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Pending
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/payments/${payment.id}`}>
                              <Button variant="ghost" size="sm">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PendingPaymentsClient;
