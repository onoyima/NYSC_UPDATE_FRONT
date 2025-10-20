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
} from "lucide-react";
import { toast } from "sonner";

interface ExcelExportButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showCard?: boolean;
}

const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  variant = "default",
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

      const response = await fetch(
        "/api/nysc/admin/docx-import/export-student-data",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("nysc_token")}`,
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

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
      let filename = "student_nysc_data.xlsx";

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
      toast.success("Student data exported successfully!");
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
      className={`min-w-[140px] ${className}`}
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
          Export to Excel
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
          <FileSpreadsheet className="h-5 w-5" />
          Export Student Data
        </CardTitle>
        <CardDescription>
          Download complete student NYSC data including Class of Degree
          information as an Excel file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Export Includes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Matriculation Number</li>
            <li>• Student Names (First, Middle, Last)</li>
            <li>• Contact Information (Phone, State)</li>
            <li>
              • Academic Information (Class of Degree, Course of Study, Study
              Mode)
            </li>
            <li>
              • Personal Information (Date of Birth, Gender, Marital Status)
            </li>
            <li>• JAMB Registration Number</li>
            <li>• Graduation Year</li>
          </ul>
        </div>

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

export default ExcelExportButton;
