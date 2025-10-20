'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';

interface NyscExportButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showCard?: boolean;
}

const NyscExportButton: React.FC<NyscExportButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  showCard = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      toast.info('Preparing Excel export...');

      const blob = await adminService.exportStudentNyscData();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `student_nysc_data_${timestamp}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      toast.success('Excel export completed successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportStatus('error');
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Student Data
          </CardTitle>
          <CardDescription>
            Download complete student NYSC data with all fields including class of degree
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Export includes:</strong></p>
              <p className="text-xs mt-1">
                matric_no, fname, mname, lname, phone, state, class_of_degree, 
                dob, graduation_year, gender, marital_status, jamb_no, course_study, study_mode
              </p>
            </div>
            
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className={`w-full ${className}`}
              variant={variant}
              size={size}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>

            {exportStatus === 'success' && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Export completed successfully!
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Export failed. Please try again or contact support if the problem persists.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className={className}
      variant={variant}
      size={size}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Exporting...
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export NYSC Data
        </>
      )}
    </Button>
  );
};

export default NyscExportButton;