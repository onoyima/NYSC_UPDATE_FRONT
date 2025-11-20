"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  CreditCard,
  Users,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import PendingPaymentsTest from '@/components/admin/PendingPaymentsTest';

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

const PendingPaymentsPage: React.FC = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<PendingStats | null>(null);
  const [allPendingPayments, setAllPendingPayments] = useState<PendingPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAge, setFilterAge] = useState<'all' | 'recent' | 'old'>('all');

  useEffect(() => {
    const token = localStorage.getItem('nysc_token');
    const storedUserType = localStorage.getItem('nysc_user_type');
    
    if (!token || storedUserType !== 'admin') {
      router.push('/admin/login');
      return;
    }
    
    setUserType(storedUserType);
    setIsLoading(false);
    
    // Load initial data
    fetchPendingPayments();
  }, [router]);

  useEffect(() => {
    // Filter payments based on search and age filter
    let filtered = allPendingPayments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.student?.matric_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.student?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply age filter
    switch (filterAge) {
      case 'recent':
        filtered = filtered.filter(payment => payment.age_minutes <= 5);
        break;
      case 'old':
        filtered = filtered.filter(payment => payment.age_minutes > 5);
        break;
      default:
        break;
    }

    setFilteredPayments(filtered);
  }, [allPendingPayments, searchTerm, filterAge]);

  const fetchPendingPayments = async () => {
    try {
      setIsRefreshing(true);
      console.log('=== STARTING FETCH PENDING PAYMENTS ===');
      
      // Always try the test endpoint first to ensure it works
      console.log('Trying test endpoint first...');
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/nysc/test-pending-payments`);
      console.log('Test response status:', testResponse.status);
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Test data received:', testData);
        
        if (testData.success) {
          setStats(testData.stats);
          setAllPendingPayments(testData.recent_pending);
          toast.success(`✅ Loaded ${testData.stats.total_pending} pending payments (test mode)`);
          console.log('=== SUCCESS: Data loaded from test endpoint ===');
          return;
        }
      }
      
      // If test endpoint fails, try the authenticated endpoint
      console.log('Test endpoint failed, trying authenticated endpoint...');
      const token = localStorage.getItem('nysc_token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/nysc/admin/payments/pending-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      console.log('Auth response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth endpoint error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Auth response data:', data);
      
      if (data.success) {
        setStats(data.stats);
        setAllPendingPayments(data.recent_pending);
        toast.success(`✅ Loaded ${data.stats.total_pending} pending payments`);
        console.log('=== SUCCESS: Data loaded from auth endpoint ===');
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error: any) {
      console.error('=== ERROR in fetchPendingPayments ===', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      toast.error(`❌ Failed to load pending payments: ${errorMessage}`);
      
      // Set some dummy data so the page doesn't look broken
      setStats({
        total_pending: 0,
        pending_last_hour: 0,
        pending_last_24h: 0,
        pending_older_than_5min: 0,
        oldest_pending: null,
      });
      setAllPendingPayments([]);
    } finally {
      setIsRefreshing(false);
      console.log('=== FETCH PENDING PAYMENTS COMPLETE ===');
    }
  };

  const verifyAllPendingPayments = async () => {
    try {
      setIsVerifying(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/nysc/admin/payments/verify-pending`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force: false,
          limit: 100
        })
      });

      if (!response.ok) {
        throw new Error('Failed to verify pending payments');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        
        if (data.stats) {
          toast.info(`Verified ${data.stats.verified} payments: ${data.stats.successful} successful, ${data.stats.failed} failed`);
        }
        
        // Refresh data after verification
        setTimeout(fetchPendingPayments, 3000);
      } else {
        throw new Error(data.message || 'Verification failed');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/nysc/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        
        if (data.new_status) {
          toast.info(`Payment status updated to: ${data.new_status}`);
        }
        
        // Refresh data after verification
        fetchPendingPayments();
      } else {
        throw new Error(data.message || 'Verification failed');
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
    if (minutes < 5) return 'bg-green-100 text-green-800';
    if (minutes < 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatAge = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
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
        <Sidebar />
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Pending Payments
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Monitor and verify pending Paystack transactions
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={fetchPendingPayments}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/nysc/test-pending-payments`);
                        const data = await response.json();
                        if (data.success) {
                          setStats(data.stats);
                          setAllPendingPayments(data.recent_pending);
                          toast.success(`🔧 Manual load: ${data.stats.total_pending} payments`);
                        }
                      } catch (error) {
                        toast.error('Manual load failed');
                      }
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    🔧 Manual Load
                  </Button>
                  
                  <Button
                    onClick={verifyAllPendingPayments}
                    variant="default"
                    size="sm"
                    disabled={isVerifying || !stats?.pending_older_than_5min}
                  >
                    <CheckCircle className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                    {isVerifying ? 'Verifying...' : 'Verify All Pending'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Debug Information */}
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <p>Stats loaded: {stats ? 'Yes' : 'No'}</p>
              <p>Total pending: {stats?.total_pending || 'Not loaded'}</p>
              <p>Recent pending count: {allPendingPayments.length}</p>
              <p>Is refreshing: {isRefreshing ? 'Yes' : 'No'}</p>
              <p>User type: {userType || 'Not set'}</p>
            </div>

            {/* API Test Component */}
            <div className="mb-6">
              <PendingPaymentsTest />
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_pending}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.pending_last_hour}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.pending_last_24h}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Need Verification</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.pending_older_than_5min}</div>
                    <p className="text-xs text-muted-foreground">
                      Older than 5 minutes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Alert for old pending payments */}
            {stats && stats.pending_older_than_5min > 0 && (
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>{stats.pending_older_than_5min} payments</strong> have been pending for more than 5 minutes and should be verified with Paystack.
                  {stats.oldest_pending && ` Oldest pending payment: ${stats.oldest_pending}`}
                </AlertDescription>
              </Alert>
            )}

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by reference, matric number, or student name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterAge === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterAge('all')}
                    >
                      All ({allPendingPayments.length})
                    </Button>
                    <Button
                      variant={filterAge === 'recent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterAge('recent')}
                    >
                      Recent ({allPendingPayments.filter(p => p.age_minutes <= 5).length})
                    </Button>
                    <Button
                      variant={filterAge === 'old' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterAge('old')}
                    >
                      Old ({allPendingPayments.filter(p => p.age_minutes > 5).length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Pending Payments ({filteredPayments.length})</CardTitle>
                    <CardDescription>
                      All pending payments that need verification with Paystack
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {payment.reference}
                            </div>
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
                            <div className="text-sm">
                              {new Date(payment.created_at).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getAgeColor(payment.age_minutes)}>
                              {formatAge(payment.age_minutes)} ago
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => verifySinglePayment(payment.id)}
                                variant="outline"
                                size="sm"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    {allPendingPayments.length === 0 ? (
                      <div>
                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">No Pending Payments</h3>
                        <p className="text-gray-500">All payments have been processed successfully!</p>
                      </div>
                    ) : (
                      <div>
                        <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">No Matching Payments</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PendingPaymentsPage;