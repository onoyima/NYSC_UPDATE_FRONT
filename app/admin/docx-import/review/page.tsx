'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ImportReviewTable, { ReviewData } from '@/components/admin/ImportReviewTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ImportSummary {
  total_extracted: number;
  total_matched: number;
  ready_for_review: number;
}

interface SessionData {
  session_id: string;
  original_filename: string;
  summary: ImportSummary;
  review_data: ReviewData[];
  expires_at: string;
}

const DocxImportReviewPage = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!hasPermission('canManageSystem')) {
        toast.error('You do not have permission to access this page');
        router.push('/admin');
        return;
      }

      if (!sessionId) {
        toast.error('No session ID provided');
        router.push('/admin/docx-import');
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router, sessionId]);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return;

      try {
        setIsLoadingData(true);
        const response = await fetch(`/api/nysc/admin/docx-import/review/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError('Session not found or expired');
            toast.error('Import session not found or expired');
            setTimeout(() => router.push('/admin/docx-import'), 3000);
          } else if (response.status === 410) {
            setError('Session has expired');
            toast.error('Import session has expired');
            setTimeout(() => router.push('/admin/docx-import'), 3000);
          } else {
            throw new Error(result.message || 'Failed to load session data');
          }
          return;
        }

        if (result.success) {
          setSessionData(result);
          setReviewData(result.review_data);
        } else {
          throw new Error(result.message || 'Failed to load session data');
        }

      } catch (error) {
        console.error('Error fetching session data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (userType === 'admin' && hasPermission('canManageSystem') && sessionId) {
      fetchSessionData();
    }
  }, [userType, hasPermission, sessionId, router]);

  const handleApprovalChange = (matricNo: string, approved: boolean) => {
    setReviewData(prev => 
      prev.map(item => 
        item.matric_no === matricNo 
          ? { ...item, approved }
          : item
      )
    );
  };

  const handleBulkApproval = (approved: boolean) => {
    setReviewData(prev => 
      prev.map(item => 
        item.needs_update 
          ? { ...item, approved }
          : item
      )
    );
  };

  const handleApplyUpdates = () => {
    const approvedCount = reviewData.filter(item => item.approved).length;
    if (approvedCount === 0) {
      toast.error('Please approve at least one record before applying updates');
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmApplyUpdates = async () => {
    if (!sessionId) return;

    try {
      setIsApplying(true);
      setShowConfirmDialog(false);

      const approvals = reviewData.map(item => ({
        student_id: item.student_id,
        matric_no: item.matric_no,
        proposed_class_of_degree: item.proposed_class_of_degree,
        approved: item.approved
      }));

      const response = await fetch('/api/nysc/admin/docx-import/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          approvals
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to apply updates');
      }

      if (result.success) {
        const { updated_count, error_count, errors } = result.result;
        
        if (updated_count > 0) {
          toast.success(`Successfully updated ${updated_count} student record${updated_count !== 1 ? 's' : ''}`);
        }
        
        if (error_count > 0) {
          toast.warning(`${error_count} record${error_count !== 1 ? 's' : ''} failed to update`);
          console.warn('Update errors:', errors);
        }

        // Redirect back to import page after success
        setTimeout(() => {
          router.push('/admin/docx-import');
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to apply updates');
      }

    } catch (error) {
      console.error('Error applying updates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply updates';
      toast.error(errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  const handleBackToImport = () => {
    router.push('/admin/docx-import');
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userType !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <ProtectedRoute userType="admin">
        <div className="min-h-screen bg-background">
          <Sidebar />
          <Navbar userType="admin" />
          
          <main className="ml-0 md:ml-64 pt-20 p-4 md:p-6 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={handleBackToImport}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Import
                </Button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const approvedCount = reviewData.filter(item => item.approved).length;
  const timeRemaining = sessionData ? new Date(sessionData.expires_at).getTime() - Date.now() : 0;
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Navbar userType="admin" />
        
        <main className="ml-0 md:ml-64 pt-20 p-4 md:p-6 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" onClick={handleBackToImport}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Import
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Review Import Data
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review and approve Class of Degree updates before applying to the database
                  </p>
                </div>
              </div>

              {/* Session Info */}
              {sessionData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Source File</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium truncate" title={sessionData.original_filename}>
                        {sessionData.original_filename}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Session Expires</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {hoursRemaining}h {minutesRemaining}m remaining
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ready to Apply</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium text-green-600">
                        {approvedCount} record{approvedCount !== 1 ? 's' : ''}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Review Table */}
            <ImportReviewTable
              data={reviewData}
              onApprovalChange={handleApprovalChange}
              onBulkApproval={handleBulkApproval}
              isLoading={isApplying}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <Button variant="outline" onClick={handleBackToImport} disabled={isApplying}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyUpdates} 
                disabled={approvedCount === 0 || isApplying}
                className="min-w-[150px]"
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Apply Updates ({approvedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Updates</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply updates to {approvedCount} student record{approvedCount !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApplyUpdates}>
              Yes, Apply Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
};

export default DocxImportReviewPage;