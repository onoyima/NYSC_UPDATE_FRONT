"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface NullDegreeExportButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showCard?: boolean;
}

const NullDegreeExportButton: React.FC<NullDegreeExportButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
  showCard = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportStatus("idle");

      // Use full backend URL
      const backendUrl = "http://localhost:8000";
      
      // First test if we can reach the backend
      console.log('Testing backend connection...');
      const testResponse = await fetch(`${backendUrl}/api/nysc/test-connection`);
      console.log('Test response status:', testResponse.status);
      const testData = await testResponse.json();
      console.log('Test data:', testData);

      console.log('Making export request...');
      const response = await fetch(
        `${backendUrl}/api/nysc/export-null-degree-students`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );
      console.log('Export response status:', response.status);
      console.log('Export response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Export failed with status ${response.status}`
        );
      }

      // Get the blob data
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "students_null_class_of_degree.xlsx";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus("success");
      toast.success("Students with NULL class of degree exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Export failed";
      setExportStatus("error");
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus("idle");
      }, 3000);
    }
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={`min-w-[180px] ${className}`}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Exporting...
        </>
      ) : exportStatus === "success" ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Exported!
        </>
      ) : exportStatus === "error" ? (
        <>
          <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
          Try Again
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export NULL Degrees
        </>
      )}
    </Button>
  );

  if (!showCard) {
    return buttonContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Export Students with NULL Class of Degree
        </CardTitle>
        <CardDescription>
          Download student records that are missing Class of Degree information
          as an Excel file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">Export Includes:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Students with NULL/empty Class of Degree field</li>
            <li>• Matriculation Number</li>
            <li>• Student Names (First, Middle, Last)</li>
            <li>• Contact Information (Phone, State)</li>
            <li>• Academic Information (Course of Study, Study Mode)</li>
            <li>• Personal Information (Date of Birth, Gender, Marital Status)</li>
            <li>• JAMB Registration Number</li>
            <li>• Graduation Year</li>
          </ul>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This export specifically targets students who need their Class of
            Degree information updated. Use this to identify records that
            require attention.
          </AlertDescription>
        </Alert>

        {exportStatus === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Export completed successfully! The file has been downloaded to
              your device.
            </AlertDescription>
          </Alert>
        )}

        {exportStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Export failed. Please try again or contact support if the problem
              persists.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">{buttonContent}</div>
      </CardContent>
    </Card>
  );
};

export default NullDegreeExportButton;