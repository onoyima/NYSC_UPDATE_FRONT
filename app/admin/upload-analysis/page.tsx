"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Sidebar from "@/components/common/Sidebar";
import Navbar from "@/components/common/Navbar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileSpreadsheet,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  BarChart3,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import adminService from "@/services/admin.service";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  last_modified: string;
  type: string;
}

interface AnalysisData {
  success: boolean;
  file_info: {
    path: string;
    name: string;
    type: string;
    size: number;
    last_modified: string;
    total_sheets: number;
    sheet_names: string[];
    total_rows: number;
    max_columns: number;
    available_files: FileInfo[];
  };
  extraction: {
    total_excel_rows: number;
    valid_student_ids: number;
    unique_uploaded_ids: number[];
    invalid_matric_numbers: Array<{
      sheet: string;
      row: number;
      matric: string;
    }>;
    duplicate_count: number;
    extraction_samples: Array<{
      sheet: string;
      row: number;
      original_matric: string;
      extracted_id: number;
    }>;
    sheets_processed: number;
  };
  sheet_details: Array<{
    sheet_name: string;
    total_excel_rows: number;
    valid_student_ids: number;
    unique_uploaded_ids: number[];
    invalid_matric_numbers: Array<{
      sheet: string;
      row: number;
      matric: string;
    }>;
    duplicate_count: number;
    extraction_samples: Array<{
      sheet: string;
      row: number;
      original_matric: string;
      extracted_id: number;
    }>;
  }>;
  analysis: {
    matched: number[];
    unuploaded: number[];
    uploaded_but_not_in_nysc: number[];
  };
  statistics: {
    total_nysc_students: number;
    total_excel_rows: number;
    valid_upload_entries: number;
    invalid_matric_formats: number;
    duplicate_entries: number;
    successfully_uploaded: number;
    not_yet_uploaded: number;
    upload_anomalies: number;
    upload_percentage: number;
    unuploaded_percentage: number;
    status: string;
    status_message: string;
  };
  all_data: {
    matched: Array<{
      student_id: number;
      matric_no: string;
      name: string;
      course_study: string;
    }>;
    unuploaded: Array<{
      student_id: number;
      matric_no: string;
      name: string;
      course_study: string;
    }>;
    uploaded_but_not_in_nysc: Array<{ student_id: number; note: string }>;
  };
  debug_info?: {
    sheets_with_data: number;
    sheets_without_data: number;
    total_raw_rows_in_file: number;
    processing_summary: Array<{
      sheet: string;
      rows_processed: number;
      valid_extractions: number;
      unique_ids: number;
      invalid_count: number;
    }>;
  };
}

const UploadAnalysisPage: React.FC = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "matched" | "unuploaded" | "anomalies" | "extraction"
  >("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedFile, setSelectedFile] = useState<string>("uploaded_pcms.xlsx");
  const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([]);
  const [exportFilter, setExportFilter] = useState<ExportFilter>('uploaded');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

  const loadAnalysisData = useCallback(async (fileName?: string) => {
    try {
      setIsAnalyzing(true);
      const fileToAnalyze = fileName || selectedFile;
      const result = await adminService.getUploadAnalysis(fileToAnalyze);

      if (result.success) {
        setAnalysisData(result);
        setAvailableFiles(result.file_info.available_files || []);
        toast.success(`Analysis completed for ${result.file_info.name}`);
      } else {
        toast.error(result.message || "Failed to analyze uploads");
      }
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      let errorMessage = "Failed to load upload analysis";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      if (error.response?.data?.debug_info) {
        console.log("Debug info:", error.response.data.debug_info);
      }
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  useEffect(() => {
    const token = localStorage.getItem("nysc_token");
    const storedUserType = localStorage.getItem("nysc_user_type");

    if (!token || storedUserType !== "admin") {
      router.push("/admin/login");
      return;
    }

    setUserType(storedUserType);
    setIsLoading(false);

    loadAnalysisData();
  }, [router, loadAnalysisData]);


  const handleRefreshAnalysis = () => {
    setCurrentPage(1); // Reset to first page
    loadAnalysisData();
  };

  const handleFileChange = (fileName: string) => {
    setSelectedFile(fileName);
    setCurrentPage(1);
    setActiveTab("overview");
    loadAnalysisData(fileName);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await adminService.exportUploadAnalysis({ file: selectedFile, filter: exportFilter, format: exportFormat });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `upload_analysis_${exportFilter}_${new Date().toISOString().split("T")[0]}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error?.message || "Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4" />;
      case "good":
        return <CheckCircle className="h-4 w-4" />;
      case "moderate":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPaginatedData = (
    data: any[],
    page: number,
    itemsPerPage: number
  ) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: data.slice(startIndex, endIndex),
      totalPages: Math.ceil(data.length / itemsPerPage),
      totalItems: data.length,
    };
  };

  const PaginationControls = ({
    totalPages,
    currentPage,
    onPageChange,
  }: {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Reset page when switching tabs
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userType !== "admin") {
    return null;
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 pt-20 p-4 md:p-6 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    NYSC SALBAM Upload Analysis
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Analyze upload files against NYSC student database
                  </p>

                  {/* File Selection Tabs */}
                  {availableFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {availableFiles.map((file) => (
                          <Button
                            key={file.name}
                            variant={
                              selectedFile === file.name ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handleFileChange(file.name)}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            {file.name}
                            <Badge variant="secondary" className="text-xs">
                              {file.type.toUpperCase()}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                      {analysisData && (
                        <p className="text-sm text-gray-500 mt-2">
                          Currently analyzing:{" "}
                          <span className="font-semibold">
                            {analysisData.file_info.name}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleRefreshAnalysis}
                    disabled={isAnalyzing}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isAnalyzing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh Analysis
                  </Button>

                  {analysisData && (
                    <div className="flex items-center gap-2">
                      <select
                        value={exportFilter}
                        onChange={(e) => setExportFilter(e.target.value as any)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="uploaded">Uploaded</option>
                        <option value="not_uploaded">Not Uploaded</option>
                        <option value="uploaded_not_in_nysc">Uploaded Not In NYSC</option>
                      </select>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                      </select>
                      <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? "Exporting..." : "Download"}
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:8000/api/nysc/admin/upload-analysis/test-pdf', {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
                            'Accept': 'application/json',
                          },
                        });
                        const result = await response.json();
                        console.log('PDF Test Result:', result);
                        toast.success('PDF test completed - check console for details');
                      } catch (error) {
                        console.error('PDF Test Error:', error);
                        toast.error('PDF test failed - check console for details');
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Test PDF
                  </Button>
                </div>
              </div>
            </div>

            {isAnalyzing && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-lg">
                      Analyzing upload data...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisData && (
              <>
                {/* File Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      File Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">File Name</p>
                        <p className="font-semibold flex items-center gap-2">
                          {analysisData.file_info.name}
                          <Badge variant="outline">
                            {analysisData.file_info.type.toUpperCase()}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">File Path</p>
                        <p className="font-mono text-sm">
                          {analysisData.file_info.path}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">File Size</p>
                        <p className="font-semibold">
                          {(analysisData.file_info.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Modified</p>
                        <p className="font-semibold">
                          {new Date(
                            analysisData.file_info.last_modified
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Content & Dimensions
                        </p>
                        <p className="font-semibold">
                          {analysisData.file_info.type === "pdf"
                            ? "PDF Document"
                            : `${analysisData.file_info.total_sheets} sheets`}
                          , {analysisData.file_info.total_rows} total rows
                        </p>
                      </div>
                    </div>

                    {/* Sheet Details */}
                    {analysisData.file_info.type !== "pdf" && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Worksheets:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysisData.file_info.sheet_names.map(
                            (sheetName, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {sheetName}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Available Files */}
                    {availableFiles.length > 1 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Available Files:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {availableFiles.map((file) => (
                            <div
                              key={file.name}
                              className="p-2 border rounded text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {file.type.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {(file.size / 1024).toFixed(2)} KB •{" "}
                                {new Date(
                                  file.last_modified
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Overview */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Upload Status Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`flex items-center px-4 py-2 rounded-lg border ${getStatusColor(
                          analysisData.statistics.status
                        )}`}
                      >
                        {getStatusIcon(analysisData.statistics.status)}
                        <span className="ml-2 font-semibold">
                          {analysisData.statistics.status_message}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          {analysisData.statistics.upload_percentage}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Upload Coverage
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${analysisData.statistics.upload_percentage}%`,
                        }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total NYSC Students
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analysisData.statistics.total_nysc_students.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Successfully Uploaded
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {analysisData.statistics.successfully_uploaded.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analysisData.statistics.upload_percentage}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Not Yet Uploaded
                      </CardTitle>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {analysisData.statistics.not_yet_uploaded.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analysisData.statistics.unuploaded_percentage}% of
                        total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Upload Anomalies
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {analysisData.statistics.upload_anomalies.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        In upload but not in NYSC DB
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Data Quality Metrics */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Data Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Excel File Processing
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Sheets Processed:</span>
                            <span className="font-semibold">
                              {analysisData.extraction.sheets_processed.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Excel Rows:</span>
                            <span className="font-semibold">
                              {analysisData.statistics.total_excel_rows.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Valid Entries:</span>
                            <span className="font-semibold text-green-600">
                              {analysisData.statistics.valid_upload_entries.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Invalid Formats:</span>
                            <span className="font-semibold text-red-600">
                              {analysisData.statistics.invalid_matric_formats.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duplicates:</span>
                            <span className="font-semibold text-orange-600">
                              {analysisData.statistics.duplicate_entries.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Match Analysis</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Exact Matches:</span>
                            <span className="font-semibold text-green-600">
                              {analysisData.analysis.matched.length.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Missing from Upload:</span>
                            <span className="font-semibold text-red-600">
                              {analysisData.analysis.unuploaded.length.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unknown IDs:</span>
                            <span className="font-semibold text-orange-600">
                              {analysisData.analysis.uploaded_but_not_in_nysc.length.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Coverage Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Upload Rate:</span>
                            <span className="font-semibold">
                              {analysisData.statistics.upload_percentage}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Missing Rate:</span>
                            <span className="font-semibold">
                              {analysisData.statistics.unuploaded_percentage}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data Quality:</span>
                            <Badge
                              variant={
                                analysisData.statistics.status === "excellent"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {analysisData.statistics.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Data Tabs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Detailed Analysis</CardTitle>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant={
                            activeTab === "overview" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleTabChange("overview")}
                        >
                          Overview
                        </Button>
                        <Button
                          variant={
                            activeTab === "matched" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleTabChange("matched")}
                        >
                          Uploaded ({analysisData.analysis.matched.length})
                        </Button>
                        <Button
                          variant={
                            activeTab === "unuploaded" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleTabChange("unuploaded")}
                        >
                          Not Uploaded (
                          {analysisData.analysis.unuploaded.length})
                        </Button>
                        <Button
                          variant={
                            activeTab === "anomalies" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleTabChange("anomalies")}
                        >
                          Anomalies (
                          {
                            analysisData.analysis.uploaded_but_not_in_nysc
                              .length
                          }
                          )
                        </Button>
                        <Button
                          variant={
                            activeTab === "extraction" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleTabChange("extraction")}
                        >
                          Extraction Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <Alert>
                          <FileText className="h-4 w-4" />
                          <AlertDescription>
                            This analysis compares student IDs extracted from
                            matric numbers in uploaded.xlsx (pattern: /XXXX)
                            with the student_nysc database. Students are
                            considered uploaded if their student_id appears in
                            both the Excel file and the database.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold text-green-600 mb-2">
                              ✅ Successfully Uploaded
                            </h4>
                            <p className="text-sm text-gray-600">
                              Students whose IDs were found in both the upload
                              file and NYSC database. These students have been
                              successfully uploaded to SALBAM.
                            </p>
                          </div>

                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold text-red-600 mb-2">
                              ❌ Not Yet Uploaded
                            </h4>
                            <p className="text-sm text-gray-600">
                              Students in the NYSC database whose IDs were not
                              found in the upload file. These students still
                              need to be uploaded to SALBAM.
                            </p>
                          </div>

                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold text-orange-600 mb-2">
                              ⚠️ Upload Anomalies
                            </h4>
                            <p className="text-sm text-gray-600">
                              Student IDs found in the upload file but not in
                              the NYSC database. These may be data entry errors
                              or students not in our system.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "matched" && (
                      <div>
                        <h4 className="font-semibold mb-4 text-green-600">
                          Successfully Uploaded Students (
                          {analysisData.all_data.matched.length.toLocaleString()}{" "}
                          total)
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student ID</TableHead>
                              <TableHead>Matric No</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Course of Study</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const paginatedData = getPaginatedData(
                                analysisData.all_data.matched,
                                currentPage,
                                itemsPerPage
                              );
                              return paginatedData.data.map(
                                (student, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-mono">
                                      {student.student_id}
                                    </TableCell>
                                    <TableCell className="font-mono">
                                      {student.matric_no}
                                    </TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>
                                      {student.course_study}
                                    </TableCell>
                                  </TableRow>
                                )
                              );
                            })()}
                          </TableBody>
                          </Table>
                        </div>
                        <PaginationControls
                          totalPages={
                            getPaginatedData(
                              analysisData.all_data.matched,
                              currentPage,
                              itemsPerPage
                            ).totalPages
                          }
                          currentPage={currentPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}

                    {activeTab === "unuploaded" && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-red-600">
                            Students Not Yet Uploaded (
                            {analysisData.all_data.unuploaded.length.toLocaleString()}{" "}
                            total)
                          </h4>
                          <div className="flex items-center gap-2">
                            <select
                              value={exportFilter}
                              onChange={(e) => setExportFilter(e.target.value as any)}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="uploaded">Uploaded</option>
                              <option value="not_uploaded">Not Uploaded</option>
                              <option value="uploaded_not_in_nysc">Uploaded Not In NYSC</option>
                            </select>
                            <select
                              value={exportFormat}
                              onChange={(e) => setExportFormat(e.target.value as any)}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="excel">Excel</option>
                              <option value="csv">CSV</option>
                            </select>
                            <Button onClick={handleExport} disabled={isExporting} size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              {isExporting ? "Exporting..." : "Download"}
                            </Button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student ID</TableHead>
                              <TableHead>Matric No</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Course of Study</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const paginatedData = getPaginatedData(
                                analysisData.all_data.unuploaded,
                                currentPage,
                                itemsPerPage
                              );
                              return paginatedData.data.map(
                                (student, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-mono">
                                      {student.student_id}
                                    </TableCell>
                                    <TableCell className="font-mono">
                                      {student.matric_no}
                                    </TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>
                                      {student.course_study}
                                    </TableCell>
                                  </TableRow>
                                )
                              );
                            })()}
                          </TableBody>
                          </Table>
                        </div>
                        <PaginationControls
                          totalPages={
                            getPaginatedData(
                              analysisData.all_data.unuploaded,
                              currentPage,
                              itemsPerPage
                            ).totalPages
                          }
                          currentPage={currentPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}

                    {activeTab === "anomalies" && (
                      <div>
                        <h4 className="font-semibold mb-4 text-orange-600">
                          Upload Anomalies - IDs in Upload but Not in NYSC
                          Database (
                          {analysisData.all_data.uploaded_but_not_in_nysc.length.toLocaleString()}{" "}
                          total)
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Value</TableHead>
                              <TableHead>Note</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const paginatedData = getPaginatedData(
                                analysisData.all_data.uploaded_but_not_in_nysc,
                                currentPage,
                                itemsPerPage
                              );
                              return paginatedData.data.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono">
                                    {(item as any).value ?? (item as any).student_id}
                                  </TableCell>
                                  <TableCell className="text-orange-600">
                                    {item.note}
                                  </TableCell>
                                </TableRow>
                              ));
                            })()}
                          </TableBody>
                          </Table>
                        </div>
                        <PaginationControls
                          totalPages={
                            getPaginatedData(
                              analysisData.all_data.uploaded_but_not_in_nysc,
                              currentPage,
                              itemsPerPage
                            ).totalPages
                          }
                          currentPage={currentPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}

                    {activeTab === "extraction" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-4 text-blue-600">
                            Extraction Process Details
                          </h4>

                          {/* Debug Information */}
                          {analysisData.debug_info && (
                            <Alert className="mb-6">
                              <FileText className="h-4 w-4" />
                              <AlertDescription>
                                <strong>File Processing Debug:</strong> Found{" "}
                                {analysisData.debug_info.total_raw_rows_in_file.toLocaleString()}{" "}
                                total rows across{" "}
                                {analysisData.file_info.total_sheets} sheets.
                                Successfully processed{" "}
                                {analysisData.debug_info.sheets_with_data}{" "}
                                sheets with data,{" "}
                                {analysisData.debug_info.sheets_without_data}{" "}
                                sheets had no processable data.
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Extraction Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {analysisData.extraction.sheets_processed}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Sheets Processed
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {analysisData.file_info.total_rows.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Total Rows in File
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {analysisData.extraction.valid_student_ids.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Valid IDs Extracted
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {analysisData.extraction.invalid_matric_numbers.length.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Invalid Formats
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Processing Summary by Sheet */}
                          {analysisData.debug_info && (
                            <div className="mb-6">
                              <h5 className="font-semibold mb-3">
                                Processing Summary by Sheet
                              </h5>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Sheet Name</TableHead>
                                    <TableHead>Rows Processed</TableHead>
                                    <TableHead>Valid Extractions</TableHead>
                                    <TableHead>Unique IDs</TableHead>
                                    <TableHead>Invalid Count</TableHead>
                                    <TableHead>Success Rate</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {analysisData.debug_info.processing_summary.map(
                                    (summary, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {summary.sheet}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {summary.rows_processed.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-green-600 font-semibold">
                                          {summary.valid_extractions.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-blue-600 font-semibold">
                                          {summary.unique_ids.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-red-600 font-semibold">
                                          {summary.invalid_count.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              summary.rows_processed > 0 &&
                                              summary.valid_extractions /
                                                summary.rows_processed >
                                                0.8
                                                ? "default"
                                                : summary.rows_processed > 0 &&
                                                  summary.valid_extractions /
                                                    summary.rows_processed >
                                                    0.5
                                                ? "secondary"
                                                : "destructive"
                                            }
                                          >
                                            {summary.rows_processed > 0
                                              ? `${Math.round(
                                                  (summary.valid_extractions /
                                                    summary.rows_processed) *
                                                    100
                                                )}%`
                                              : "0%"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Extraction Samples */}
                          <div className="mb-6">
                            <h5 className="font-semibold mb-3">
                              Sample Extractions (showing pattern matching)
                            </h5>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Sheet</TableHead>
                                  <TableHead>Row</TableHead>
                                  <TableHead>Original Matric</TableHead>
                                  <TableHead>Extracted ID</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {analysisData.extraction.extraction_samples
                                  ?.slice(0, 20)
                                  .map((sample, index) => (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <Badge variant="outline">
                                          {sample.sheet}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{sample.row}</TableCell>
                                      <TableCell className="font-mono">
                                        {sample.original_matric}
                                      </TableCell>
                                      <TableCell className="font-mono font-bold text-green-600">
                                        {sample.extracted_id}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Sheet-by-Sheet Breakdown */}
                          <div className="mb-6">
                            <h5 className="font-semibold mb-3">
                              Sheet-by-Sheet Analysis
                            </h5>
                            <div className="space-y-4">
                              {analysisData.sheet_details?.map(
                                (sheet, index) => (
                                  <Card key={index}>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center justify-between">
                                        <span>{sheet.sheet_name}</span>
                                        <Badge variant="secondary">
                                          {sheet.unique_uploaded_ids.length}{" "}
                                          unique IDs
                                        </Badge>
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-600">
                                            Total Rows
                                          </p>
                                          <p className="font-semibold">
                                            {sheet.total_excel_rows.toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-600">
                                            Valid IDs
                                          </p>
                                          <p className="font-semibold text-green-600">
                                            {sheet.valid_student_ids.toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-600">
                                            Invalid Formats
                                          </p>
                                          <p className="font-semibold text-red-600">
                                            {sheet.invalid_matric_numbers.length.toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-600">
                                            Duplicates
                                          </p>
                                          <p className="font-semibold text-orange-600">
                                            {sheet.duplicate_count.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              )}
                            </div>
                          </div>

                          {/* Invalid Formats - Show All */}
                          {analysisData.extraction.invalid_matric_numbers
                            .length > 0 && (
                            <div>
                              <h5 className="font-semibold mb-3 text-red-600">
                                All Invalid Formats (
                                {analysisData.extraction.invalid_matric_numbers.length.toLocaleString()}{" "}
                                total)
                              </h5>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Sheet</TableHead>
                                    <TableHead>Row</TableHead>
                                    <TableHead>Invalid Matric</TableHead>
                                    <TableHead>Issue</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(() => {
                                    const paginatedData = getPaginatedData(
                                      analysisData.extraction
                                        .invalid_matric_numbers,
                                      currentPage,
                                      itemsPerPage
                                    );
                                    return paginatedData.data.map(
                                      (invalid, index) => (
                                        <TableRow key={index}>
                                          <TableCell>
                                            <Badge variant="outline">
                                              {invalid.sheet}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>{invalid.row}</TableCell>
                                          <TableCell className="font-mono">
                                            {invalid.matric}
                                          </TableCell>
                                          <TableCell className="text-red-600 text-sm">
                                            {invalid.matric.includes("/")
                                              ? "No digits after last /"
                                              : "No / found"}
                                          </TableCell>
                                        </TableRow>
                                      )
                                    );
                                  })()}
                                </TableBody>
                              </Table>
                              <PaginationControls
                                totalPages={
                                  getPaginatedData(
                                    analysisData.extraction
                                      .invalid_matric_numbers,
                                    currentPage,
                                    itemsPerPage
                                  ).totalPages
                                }
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default UploadAnalysisPage;
type ExportFilter = 'uploaded' | 'not_uploaded' | 'uploaded_not_in_nysc';
