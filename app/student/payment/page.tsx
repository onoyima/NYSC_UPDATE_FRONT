'use client';

import React, { useEffect, useState } from 'react';
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
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/formatters';
import { SystemStatusWithSettings } from '@/services/admin-settings.service';

interface StudentDetails {
  student: any;
  academic: any;
  contact: any;
  nysc: any;
  is_submitted: boolean;
  is_paid: boolean;
  payment_amount: number | null;
}

interface PaymentResponse {
  message: string;
  payment_url: string;
  reference: string;
  amount: number;
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusWithSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string>('');

  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const checkConfirmationStatus = async () => {
    try {
      // Check if there's a pending temporary submission
      const response = await studentService.getDetails();
      const hasConfirmedData = localStorage.getItem('nysc_form_data') || 
                              localStorage.getItem('session_id');
      
      if (!hasConfirmedData && !response.data?.is_submitted) {
        toast.error('Please confirm your data first before making payment.');
        router.push('/student/confirm');
        return;
      }
    } catch (error) {
      console.error('Error checking confirmation status:', error);
    }
  };

  useEffect(() => {
    fetchStudentDetails();

    // Check for payment reference in URL (for verification)
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref');
    const status = urlParams.get('status');

    // Priority: reference from callback URL, then trxref from Paystack, then check status
    const paymentRef = reference || trxref;
    
    if (paymentRef && (status === 'success' || reference)) {
      console.log('Payment callback detected:', { reference, trxref, status });
      setPaymentReference(paymentRef);
      setIsVerifying(true);
      verifyPayment(paymentRef);
    } else if (status === 'cancelled') {
      toast.error('Payment was cancelled');
      checkConfirmationStatus();
    } else {
      // Check if student accessed payment page directly without confirmation
      checkConfirmationStatus();
    }
  }, []);

  const fetchStudentDetails = async () => {

    try {
      const [detailsResponse, systemStatusData] = await Promise.all([
        studentService.getDetails(),
        studentService.getSystemStatus()
      ]);
      
      setStudentDetails(detailsResponse.data);
      setSystemStatus(systemStatusData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch student details');
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await studentService.initiatePayment();
      const paymentData: PaymentResponse = response.data;

      // Redirect to Paystack payment page
      window.location.href = paymentData.payment_url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await studentService.verifyPayment(reference);
      
      // Check if payment verification was successful
      if (response.data.success) {
        toast.success('Payment verified and data submitted successfully!');

        // Clear any stored form data since payment is complete
        localStorage.removeItem('nysc_form_data');
        localStorage.removeItem('session_id');

        // Refresh student details
        await fetchStudentDetails();

        // Show success page
        setShowSuccessPage(true);
        setIsVerifying(false);

        // Redirect to dashboard after a longer delay to show receipt
        setTimeout(() => {
          router.push('/student');
        }, 5000);
      } else {
        toast.error('Payment verification failed');
        setIsVerifying(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Payment verification failed';
      toast.error(errorMessage);
      console.error('Payment verification error:', error);
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner 
          size="xl" 
          text="Loading payment information..."
          className="animate-scale-in"
        />
      </div>
    );
  }

  // Check if there's form data in localStorage or if user came from confirmation page
  const hasFormData = typeof window !== 'undefined' && localStorage.getItem('nysc_form_data');

  if (!hasFormData && !studentDetails?.is_submitted) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <Sidebar />
          <div className="flex">
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 pt-20 min-h-screen">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <CardTitle>Data Confirmation Required</CardTitle>
                    </div>
                    <CardDescription>
                      You must confirm your  making payment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please complete the data confirmation process before proceeding to payment.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-4">
                        <Link href="/student/confirm">
                          <Button>
                            Confirm Data First
                          </Button>
                        </Link>
                        <Link href="/student">
                          <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show verification loading state
  if (isVerifying) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <Sidebar />
          <div className="flex">
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 overflow-y-auto h-screen pt-20">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">
                      Verifying Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <LoadingSpinner 
                        size="lg" 
                        text="Please wait while we verify your payment..."
                        className="animate-fade-in"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (showSuccessPage) {
    return (
      <ProtectedRoute userType="student">
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <CardTitle>Payment Completed</CardTitle>
                    </div>
                    <CardDescription>
                      Your student information update payment has been successfully processed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">Payment Receipt</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-green-700 font-medium">Student Name:</span>
                            <span className="text-green-800">{studentDetails?.student?.fname} {studentDetails?.student?.lname}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-green-700 font-medium">Matric Number:</span>
                            <span className="text-green-800">{studentDetails?.student?.matric_no}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-green-700 font-medium">Username:</span>
                            <span className="text-green-800">{studentDetails?.student?.username}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-green-700 font-medium">Amount Paid:</span>
                            <span className="text-green-800 font-semibold">{formatCurrency(studentDetails?.payment_amount || 0)}</span>
                          </div>
                          {paymentReference && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-green-700 font-medium">Reference:</span>
                              <span className="text-green-800 font-mono text-xs">{paymentReference}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-green-700 font-medium">Date:</span>
                            <span className="text-green-800">{new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Link href="/student">
                        <Button className="w-full">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Dashboard
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
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
            <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Student Information Update Payment</h1>
                  <p className="text-muted-foreground">
                    Complete your student information update by making the required payment.
                  </p>
                </div>
                <Link href="/student">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
              </div>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    Review your payment information before proceeding.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Student Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">
                          {studentDetails?.student?.fname || user?.name} {studentDetails?.student?.lname}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Matric No:</span>
                        <span className="ml-2 font-medium">
                          {studentDetails?.academic?.matric_no || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2 font-medium">
                          {studentDetails?.nysc?.email || studentDetails?.student?.username || user?.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2 font-medium">
                          {studentDetails?.nysc?.phone || studentDetails?.student?.phone || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div className="border-2 border-primary/20 bg-primary/5 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold mb-2">Information Update Fee</h3>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatCurrency(systemStatus?.current_fee || studentDetails?.payment_amount || 0)}
                    </div>
                    <Badge variant={systemStatus?.is_late_fee ? "destructive" : "secondary"}>
                      {systemStatus?.is_late_fee ? 'Late Fee' : 'Standard Fee'}
                    </Badge>
                    {systemStatus?.is_late_fee && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Payment deadline has passed. Late fee applies.
                      </p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Method</h3>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">PAY</span>
                        </div>
                        <div>
                          <p className="font-medium">Paystack</p>
                          <p className="text-sm text-muted-foreground">
                            Secure payment with card, bank transfer, or USSD
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> After clicking "Pay Now", you will be redirected to Paystack's secure payment page.
                      Do not close your browser until the payment is completed.
                    </AlertDescription>
                  </Alert>

                  {/* Pay Button */}
                  <Button
                    onClick={initiatePayment}
                    disabled={isProcessing}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay {formatCurrency(systemStatus?.current_fee || studentDetails?.payment_amount || 0)} Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PaymentPage;
