'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';
import { ExportOptions } from '@/types/admin.types';

interface ExportButtonProps {
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ className }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      toast.info(`Preparing ${format.toUpperCase()} export...`);

      const options: ExportOptions = {
        format,
        filters: {} // Add any filters here if needed
      };

      let blob;
      if (format === 'excel') {
        // Use our new NYSC-specific export
        blob = await adminService.exportStudentNyscData();
      } else {
        // Use the old export for other formats
        blob = await adminService.exportData(options);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const extension = format === 'excel' ? 'xlsx' : format;
      link.download = `nysc_students_${timestamp}.${extension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} export completed successfully!`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'csv':
        return <FileText className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        onClick={() => handleExport('excel')}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {getIcon('excel')}
        Excel
      </Button>
      
      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {getIcon('csv')}
        CSV
      </Button>
      
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {getIcon('pdf')}
        PDF
      </Button>
    </div>
  );
};

export default ExportButton;