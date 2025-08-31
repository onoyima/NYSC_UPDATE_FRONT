'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import studentService from '@/services/student.service';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { CreditCard, CheckCircle, Clock, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  reference: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  payment_date: string;
  description: string;
}

interface PaymentSummary {
  total_paid: number;
  amount_due: number;
  payment_status: 'completed' | 'pending' | 'partial' | 'none';
  last_payment_date: string | null;
}

interface PaymentHistoryData {
  payments: PaymentRecord[];
  summary: PaymentSummary;
}

const PaymentHistory: React.FC = () => {
  const [paymentData, setPaymentData] = useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await studentService.getPaymentHistory();
      setPaymentData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSummaryStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Fully Paid</Badge>;
      case 'partial':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Partially Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Payment Pending</Badge>;
      default:
        return <Badge variant="secondary">No Payment</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load payment history.</p>
        </CardContent>
      </Card>
    );
  }

  const { payments, summary } = paymentData;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
              <CardDescription>
                Overview of your payment status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPaymentHistory}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.total_paid)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.amount_due)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <div>{getSummaryStatusBadge(summary.payment_status)}</div>
            </div>
          </div>
          
          {summary.last_payment_date && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Last Payment: {formatDate(summary.last_payment_date)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All your payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payment history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={payment.id}>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.description}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reference: {payment.reference}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.status === 'completed' && (
                        <Button variant="ghost" size="sm">
                          <Download className="mr-1 h-3 w-3" />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < payments.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;