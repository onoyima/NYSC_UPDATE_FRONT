'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DocxImportForm from '@/components/admin/DocxImportForm';
import ExcelExportButton from '@/components/admin/ExcelExportButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Users, CheckCircle, AlertCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportSummary {
  total_extracted: number;
  total_matched: number;
  ready_for_review: number;
}

interface ImportStats {
  total_students: number;
  students_with_class_degree: number;
  students_without_class_degree: number;
  class_degree_distribution: Record<string, number>;
}

const DocxImportPage = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch('/api/nysc/admin/docx-import/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats(result.stats);
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (userType === 'admin' && hasPermission('canManageSystem')) {
      fetchStats();
    }
  }, [userType, hasPermission]);

  const handleUploadSuccess = (newSessionId: string, newSummary: ImportSummary) => {
    setSessionId(newSessionId);
    setSummary(newSummary);
    setUploadSuccess(true);
  };

  const handleUploadError = (error: string) => {
    setUploadSuccess(false);
    setSessionId(null);
    setSummary(null);
  };

  const handleProceedToReview = () => {
    if (sessionId) {
      router.push(`/admin/docx-import/review?session=${sessionId}`);
    }
  };

  const handleStartNewImport = () => {
    setUploadSuccess(false);
    setSessionId(null);
    setSummary(null);
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
        
        <main className="ml-0 md:ml-64 pt-20 p-4 md:p-6 min-h-screen">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                DOCX Class of Degree Import
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Import Class of Degree information from Word documents and update student records.
              </p>
            </div>

            {/* Statistics Cards */}
            {!isLoadingStats && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_students.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">With Class of Degree</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.students_with_class_degree.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {((stats.students_with_class_degree / stats.total_students) * 100).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Without Class of Degree</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.students_without_class_degree.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {((stats.students_without_class_degree / stats.total_students) * 100).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Class Distribution</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {Object.entries(stats.class_degree_distribution).map(([degree, count]) => (
                        <div key={degree} className="flex justify-between text-xs">
                          <span className="truncate">{degree}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Test API Connection */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/nysc/admin/docx-import/test', {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
                        },
                      });
                      const result = await response.json();
                      toast.success('API Connection: ' + result.message);
                    } catch (error) {
                      toast.error('API Connection Failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test API Connection
                </Button>
              </CardContent>
            </Card>

            {/* Main Content */}
            <div className="space-y-8">
              {!uploadSuccess ? (
                /* Upload Form */
                <DocxImportForm
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              ) : (
                /* Success State */
                <div className="space-y-6">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      File processed successfully! Review the extracted data before applying updates.
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle>Processing Summary</CardTitle>
                      <CardDescription>
                        Review the results of the DOCX file processing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {summary.total_extracted}
                            </div>
                            <div className="text-sm text-blue-800">Records Extracted</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {summary.total_matched}
                            </div>
                            <div className="text-sm text-green-800">Students Matched</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {summary.ready_for_review}
                            </div>
                            <div className="text-sm text-purple-800">Ready for Review</div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={handleStartNewImport} variant="outline">
                          Start New Import
                        </Button>
                        <Button onClick={handleProceedToReview} className="min-w-[150px]">
                          Review & Approve
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Export and Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Export Card */}
                <ExcelExportButton showCard={true} />

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Import Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium">Prepare Your DOCX File</h4>
                          <p className="text-sm text-gray-600">
                            Ensure your Word document contains matriculation numbers and their corresponding Class of Degree information in a clear format.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium">Upload and Process</h4>
                          <p className="text-sm text-gray-600">
                            Upload your .docx file and the system will automatically extract and match the data with existing student records.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium">Review and Approve</h4>
                          <p className="text-sm text-gray-600">
                            Review the matched data, approve the updates you want to apply, and the system will update the student records accordingly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default DocxImportPage;