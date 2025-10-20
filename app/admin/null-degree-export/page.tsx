'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import NullDegreeExportButton from '@/components/admin/NullDegreeExportButton';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NullDegreeExportPage() {
  const { userType, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }
    }
  }, [userType, isLoading, router]);

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
              <PageHeader
                title="NULL Class of Degree Export"
                description="Export students who are missing their Class of Degree information"
                icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
              />
            </div>

            {/* Information Card */}
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-5 w-5" />
                  Incomplete Records
                </CardTitle>
                <CardDescription className="text-amber-800">
                  This page helps you identify and export student records that are missing their Class of Degree information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    <strong>Purpose:</strong> Use this export to identify students who need their Class of Degree field updated. 
                    These records may be incomplete due to data import issues or missing information from the original sources.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Export Section */}
            <NullDegreeExportButton showCard={true} />

            {/* Instructions Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Step 1: Export Data</h4>
                    <p className="text-sm text-gray-600">
                      Click the export button above to download an Excel file containing all students with NULL Class of Degree.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Step 2: Review Records</h4>
                    <p className="text-sm text-gray-600">
                      Open the Excel file to review which students are missing their Class of Degree information.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Step 3: Update Records</h4>
                    <p className="text-sm text-gray-600">
                      Use the DOCX import feature or manual updates to add the missing Class of Degree information.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Step 4: Verify</h4>
                    <p className="text-sm text-gray-600">
                      Re-export to confirm that the number of records with NULL Class of Degree has decreased.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}