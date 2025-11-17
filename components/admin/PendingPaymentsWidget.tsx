'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  CreditCard,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';

interface PendingPayment {
  id: number;
  reference: string;
  amount: number;
  created_at: string;
  age_minutes: number;
  student: {
    matric_no: string;
    name: string;
  } | null;
}

interface PendingStats {
  total_pending: number;
  pending_last_hour: number;
  pending_last_24h: number;
  pending_older_than_5min: number;
  oldest_pending: string | null;
}

interface PendingPaymentsWidgetProps {
  className?: string;
}

const PendingPaymentsWidget: React.FC<PendingPaymentsWidgetProps> = ({ className }) => {
  const [stats, setStats] = useState<PendingStats | null>(null);
  const [recentPending, setRecentPending] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchPendingStats = async () => {
    try {
      const data = await adminService.getPendingPaymentsStats();
      if (data?.success) {
        setStats(data.stats);
        setRecentPending(data.recent_pending || []);
      } else {
        throw new Error(data?.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching pending payments stats:', error);
      toast.error('Failed to load pending payments data');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPendingPayments = async () => {
    try {
      setIsVerifying(true);
      const data = await adminService.verifyPendingPayments({ force: false, limit: 50 });
      if (data?.success) {
        toast.success(data.message);
        if (data.stats) {
          toast.info(`Verified ${data.stats.verified} payments, ${data.stats.successful} successful, ${data.stats.failed} failed`);
        }
        setTimeout(fetchPendingStats, 2000);
      } else {
        throw new Error(data?.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying pending payments:', error);
      toast.error('Failed to verify pending payments');
    } finally {
      setIsVerifying(false);
    }
  };

  const verifySinglePayment = async (paymentId: number) => {
    try {
      const data = await adminService.verifySinglePayment(paymentId);
      if (data?.success) {
        toast.success(data.message);
        if (data.new_status) {
          toast.info(`Payment status updated to: ${data.new_status}`);
        }
        fetchPendingStats();
      } else {
        throw new Error(data?.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying single payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const formatAmount = (amount: number) => {
    return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const getAgeColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-600';
    if (minutes < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    fetchPendingStats();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchPendingStats, 120000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading pending payments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Pending Payments Monitor
            </CardTitle>
            <CardDescription>
              Monitor and verify pending Paystack transactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchPendingStats}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={verifyPendingPayments}
              variant="default"
              size="sm"
              disabled={isVerifying || !stats?.pending_older_than_5min}
            >
              <CheckCircle className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying...' : 'Verify Pending'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold">{stats.total_pending}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Hour</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending_last_hour}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last 24h</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pending_last_24h}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Need Verification</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pending_older_than_5min}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Alert for old pending payments */}
        {stats && stats.pending_older_than_5min > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {stats.pending_older_than_5min} payments have been pending for more than 5 minutes and should be verified.
              {stats.oldest_pending && ` Oldest pending payment: ${stats.oldest_pending}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Pending Payments Table */}
        {recentPending.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-3">Recent Pending Payments</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPending.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      {payment.student ? (
                        <div>
                          <div className="font-medium">{payment.student.name}</div>
                          <div className="text-sm text-gray-500">{payment.student.matric_no}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No student data</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAmount(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getAgeColor(payment.age_minutes)}
                      >
                        {payment.age_minutes}m ago
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => verifySinglePayment(payment.id)}
                        variant="outline"
                        size="sm"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No pending payments found</p>
            <p className="text-sm">All payments are up to date!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingPaymentsWidget;