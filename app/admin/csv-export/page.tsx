'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle, AlertCircle, BarChart3, Database } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';

interface ExportStats {
  total_records: number;
  records_with_class_degree: number;
  records_without_class_degree: number;
  completion_percentage: number;
}

const CsvExportPage = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!hasPermission('canDownloadData')) {
        toast.error('You do not have permission to access this page');
        router.push('/admin');
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    if (userType === 'admin' && hasPermission('canDownloadData')) {
      fetchStats();
    }
  }, [userType, hasPermission]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const token = localStorage.getItem('nysc_token');
      console.log('Token:', token ? 'exists' : 'missing');
      
      const result = await adminService.getCsvExportStats();
      setStats(result.stats);
      
      console.log('Stats loaded successfully');

      // Stats are already set above

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCsvExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      toast.info('Preparing CSV export...');

      const blob = await adminService.exportStudentNyscCsv();

      // Blob is already available
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `student_nysc_data_${timestamp}.csv`;
      
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      toast.success('CSV export completed successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportStatus('error');
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
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
        <Sidebar />
        <Navbar userType="admin" />
        
        <main className="ml-0 md:ml-64 pt-20 p-4 md:p-6 min-h-screen">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                CSV Export
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Export student NYSC data to CSV format with exact database column headers
              </p>
            </div>

            {/* Statistics Cards */}
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_records.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">With Class of Degree</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.records_with_class_degree.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Without Class of Degree</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.records_without_class_degree.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.completion_percentage}%</div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Export Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Export Student NYSC Data
                  </CardTitle>
                  <CardDescription>
                    Download complete student data in CSV format with exact database column headers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Column Headers Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">CSV Column Headers (Exact Database Fields):</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                        {[
                          'matric_no', 'fname', 'mname', 'lname', 'phone', 'state', 
                          'class_of_degree', 'dob', 'graduation_year', 'gender', 
                          'marital_status', 'jamb_no', 'course_study', 'study_mode'
                        ].map((header) => (
                          <Badge key={header} variant="outline" className="justify-start">
                            {header}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Ready to Export</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stats ? `${stats.total_records.toLocaleString()} records will be exported` : 'Loading...'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            try {
                              const result = await adminService.testCsvExportApi();
                              toast.success('API Test: ' + result.message);
                              console.log('API Test Result:', result);
                            } catch (error) {
                              toast.error('API Test Failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                              console.error('API Test Error:', error);
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Test API
                        </Button>
                        <Button
                          onClick={handleCsvExport}
                          disabled={isExporting || !stats}
                          size="lg"
                          className="min-w-[150px]"
                        >
                          {isExporting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export CSV
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {exportStatus === 'success' && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          CSV export completed successfully! The file has been downloaded to your computer.
                        </AlertDescription>
                      </Alert>
                    )}

                    {exportStatus === 'error' && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Export failed. Please try again or contact support if the problem persists.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>Exact Database Format:</strong> Column headers match the student_nysc table structure exactly
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>UTF-8 Encoding:</strong> Proper encoding for international characters and Excel compatibility
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>Complete Data:</strong> All student records including those with and without class of degree
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>Real-time Data:</strong> Export reflects the current state of the database
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CsvExportPage;