'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CountdownTimer from '@/components/common/CountdownTimer';
import DeadlineModal from '@/components/common/DeadlineModal';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';
import { useAuth } from '@/hooks/useAuth';
import { Student } from '@/types/auth.types';
import studentService from '@/services/student.service';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  FileText, 
  User, 
  BarChart3, 
  TrendingUp,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SystemStatus {
  is_open: boolean;
  deadline: string;
  is_late_fee: boolean;
  current_fee: number;
  payment_amount: number;
  late_payment_fee: number;
  countdown_title: string;
  countdown_message: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [analytics, setAnalytics] = useState({
    submissionCount: 0,
    totalPayments: 0,
    dataUpdates: 0,
    completedUpdates: 0
  });
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
    try {
      const [data, systemStatusData, analyticsData] = await Promise.all([
        studentService.getStudentDetails(),
        studentService.getSystemStatus(),
        studentService.getAnalytics()
      ]);
      
      setStudentData(data);
      setSystemStatus(systemStatusData);
      
      // Set analytics data
        setAnalytics(analyticsData);
        
        // Show deadline modal if data is not confirmed and system status is available
        if (systemStatusData && !data?.isDataConfirmed) {
          setShowDeadlineModal(true);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner 
          size="xl" 
          text="Loading dashboard..."
          className="animate-scale-in"
        />
      </div>
    );
  }

  const student = studentData || user as Student;

  const getUpdateProgress = () => {
    let progress = 25; // Base update
    if (student.isDataConfirmed) progress += 50;
    if (student.paymentStatus === 'completed') progress += 25;
    return progress;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  return (
    <ProtectedRoute userType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <div className="flex">
          <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 pt-20 md:pt-24 min-h-screen">
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col space-y-2 animate-fade-in-up">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 gradient-text">
                  <BarChart3 className="h-8 w-8 text-green-600 animate-bounce-in" />
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground animate-slide-in-right">
                  Welcome, {student.name || student.firstName} | Matric: {student.matric_no} | {typeof student.department === 'object' ? student.department?.name || 'N/A' : student.department || 'N/A'}
                </p>
              </div>

              {/* Header with Deadline Counter */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div className="flex-1">
                  {/* Welcome Message */}
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {/* Welcome back, {student.name || student.firstName}! */}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {/* Matric: {student.matric_no} | {typeof student.department === 'object' ? student.department?.name || 'N/A' : student.department || 'N/A'} */}
                    </p>
                  </div>
                  
                  {/* Mobile Deadline Counter - After welcome message on small screens */}
                  {/* <div className="lg:hidden mb-4">
                    {systemStatus && (
                      <CountdownTimer
                        deadline={systemStatus.deadline}
                        standardFee={systemStatus.payment_amount}
                        lateFee={systemStatus.late_payment_fee}
                        title={systemStatus.countdown_title}
                        message={systemStatus.countdown_message}
                        className="animate-fade-in-up"
                      />
                    )}
                  </div> */}
                </div>
                
                {/* Desktop Deadline Counter - Sticky on right edge for large screens */}
                <div className="hidden lg:block lg:fixed lg:right-4 lg:top-24 lg:w-72 lg:z-40">
                  {systemStatus && (
                    <CountdownTimer
                      deadline={systemStatus.deadline}
                      standardFee={systemStatus.payment_amount}
                      lateFee={systemStatus.late_payment_fee}
                      title={systemStatus.countdown_title}
                      message={systemStatus.countdown_message}
                      className="animate-fade-in-up shadow-lg"
                    />
                  )}
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:mr-80">
                <Card className="hover-lift animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Submission Status</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.submissionCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Times submitted to Updated Table
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getUpdateProgress()}%</div>
                    <Progress value={getUpdateProgress()} className="mt-2" />
                    <p className="text-xs text-muted-foreground">
                      Update completion
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₦{(analytics.totalPayments || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total successful payments
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Data Updates</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.dataUpdates || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Student Updated Information
                    </p>
                  </CardContent>
                </Card>
              </div>



              {/* Update Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Update Progress Overview
                  </CardTitle>
                  <CardDescription>
                    Complete all steps to finish your information update
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{getUpdateProgress()}%</span>
                    </div>
                    <Progress value={getUpdateProgress()} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      {student.isDataConfirmed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">Data Confirmation</p>
                        <p className="text-sm text-muted-foreground">
                          {student.isDataConfirmed ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      {student.paymentStatus === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">Payment</p>
                        <p className="text-sm text-muted-foreground">
                          {student.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Complete your Update process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Link href="/student/confirm">
                      <Button 
                        variant={student.isDataConfirmed ? "outline" : "default"} 
                        className="w-full h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <FileText className="h-6 w-6" />
                        <div className="text-center">
                          <p className="font-medium">Confirm Data</p>
                          <p className="text-xs text-muted-foreground">
                            {student.isDataConfirmed ? 'Review your data' : 'Verify your information'}
                          </p>
                        </div>
                      </Button>
                    </Link>

                    <Link href="/student/payment">
                      <Button 
                        variant={student.paymentStatus === 'completed' ? "outline" : "default"} 
                        className="w-full h-auto p-4 flex flex-col items-center gap-2"
                        disabled={!student.isDataConfirmed}
                      >
                        <CreditCard className="h-6 w-6" />
                        <div className="text-center">
                          <p className="font-medium">Make Payment</p>
                          <p className="text-xs text-muted-foreground">
                            {student.paymentStatus === 'completed' ? 'Payment completed' : 'Pay update fee'}
                          </p>
                        </div>
                      </Button>
                    </Link>

                    <Link href="/student/documents">
                      <Button 
                        variant="outline" 
                        className="w-full h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <FileText className="h-6 w-6" />
                        <div className="text-center">
                          <p className="font-medium">Documents</p>
                          <p className="text-xs text-muted-foreground">
                            View your documents
                          </p>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notice */}
              {!student.isDataConfirmed && (
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-5 w-5" />
                      Action Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Please confirm your data to proceed with payment. Any changes to your information will require a new payment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
        
        {/* Deadline Modal */}
         {systemStatus && studentData && (
           <DeadlineModal
             isOpen={showDeadlineModal}
             onClose={() => setShowDeadlineModal(false)}
             deadline={systemStatus.deadline}
             currentFee={systemStatus.current_fee}
             isLate={systemStatus.is_late_fee}
             isDataConfirmed={studentData.isDataConfirmed || false}
           />
         )}
         
         {/* WhatsApp Icon */}
         <WhatsAppIcon />
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
