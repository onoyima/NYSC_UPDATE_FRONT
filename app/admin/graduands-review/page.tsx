"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ImportReviewTable from "@/components/admin/ImportReviewTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Upload,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { ReviewData, ImportSummary } from "@/types/docx-import.types";
import NyscExportButton from "@/components/admin/NyscExportButton";
import adminService from "@/services/admin.service";

interface GraduandsFile {
  name: string;
  size: string;
  modified: string;
  session_id?: number | null;
  session_name?: string | null;
  graduation_date?: string | null;
}

interface GraduandsMatchData {
  success: boolean;
  summary: {
    total_students_with_null_degree: number;
    total_extracted_from_docx: number;
    total_matches_found: number;
    exact_matches: number;
    similar_matches: number;
    total_unmatched: number;
    current_file: string;
    available_files: GraduandsFile[];
    file_last_modified: string;
  };
  matches: (ReviewData & {
    match_type?: 'exact' | 'similar';
    graduands_matric?: string;
    similarity_type?: string;
  })[];
  unmatched: Array<{
    docx_matric: string;
    normalized_matric: string;
    class_of_degree: string;
    student_name?: string;
  }>;
  message: string;
}

const GraduandsReviewPage = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [matchData, setMatchData] = useState<GraduandsMatchData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string>("GRADUANDS.docx");
  const [showEnforceConfirm, setShowEnforceConfirm] = useState(false);
  const [enforceStats, setEnforceStats] = useState<{ scanned?: number; kept_ok?: number; nullified_not_in_docx?: number; nullified_mismatch?: number; updated_to_docx?: number; already_null?: number } | null>(null);
  const [isEnforcePreviewing, setIsEnforcePreviewing] = useState(false);
  const [enforceDetails, setEnforceDetails] = useState<{ not_in_docx?: any[]; updated_to_docx?: any[] } | null>(null);
  const [selectedActions, setSelectedActions] = useState<Record<string, { selected: boolean; action: 'update' | 'nullify'; value?: string }>>({});
  const [activeTab, setActiveTab] = useState<"review" | "upload">("review");
  const [sessions, setSessions] = useState<any[]>([]);
  const [graduandsFiles, setGraduandsFiles] = useState<GraduandsFile[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<number | "">("");
  const [uploadGraduationDate, setUploadGraduationDate] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) {
      if (userType !== "admin") {
        router.push("/login");
        return;
      }

      if (!hasPermission("canManageSystem")) {
        toast.error("You do not have permission to access this page");
        router.push("/admin");
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    if (userType === "admin" && hasPermission("canManageSystem")) {
      const loadPage = async () => {
        // Load lightweight data (sessions + files) first so they are never
        // blocked behind the slow DOCX matching request.
        await Promise.allSettled([
          adminService.getSessions().then((res: any) => {
            if (res.success) {
              setSessions(res.sessions || []);
              if (!uploadSessionId && res.active_session_id) {
                setUploadSessionId(res.active_session_id);
              }
            }
          }),
          adminService.getGraduandsFiles().then((res: any) => {
            if (res.success) {
              setGraduandsFiles(res.files || []);
            }
          }),
        ]);

        fetchMatches();
      };
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, hasPermission]);

  const fetchMatches = async (fileName?: string) => {
    try {
      setIsLoadingData(true);
      setError(null);

      const fileToProcess = fileName || selectedFile;
      const result = await adminService.getGraduandsMatches(fileToProcess);

      if (!result.success) {
        setMatchData(result);
        const msg = result.message || `Failed to process ${fileToProcess}`;
        setError(msg);
        toast.error(msg);
        return;
      }

      setMatchData(result);

      // Initialize approvals state
      const initialApprovals: Record<string, boolean> = {};
      result.matches.forEach((item: ReviewData) => {
        initialApprovals[item.matric_no] = false;
      });
      setApprovals(initialApprovals);

      toast.success(
        `Found ${result.matches.length} matches (${result.summary.exact_matches || 0} exact, ${result.summary.similar_matches || 0} similar), ${result.summary.total_unmatched} unmatched records from ${fileToProcess}`
      );
    } catch (error) {
      console.error("Error fetching matches:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to load matches";

      if (errorMessage.includes("timeout")) {
        toast.error(
          "Processing timeout - the GRADUANDS file might be too large. Please try again or contact support."
        );
      } else {
        toast.error("Failed to load matches: " + errorMessage);
      }
      setError(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const refreshMatches = async () => {
    try {
      setIsProcessing(true);
      toast.info(`Refreshing matches from ${selectedFile}...`);
      await fetchMatches(selectedFile);
      toast.success("Matches refreshed successfully");
    } catch (error) {
      console.error("Error refreshing matches:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to refresh matches"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprovalChange = (matricNo: string, approved: boolean) => {
    setApprovals((prev) => ({
      ...prev,
      [matricNo]: approved,
    }));
  };

  const handleBulkApproval = (approved: boolean) => {
    if (!matchData) return;

    const newApprovals: Record<string, boolean> = {};
    matchData.matches.forEach((item) => {
      newApprovals[item.matric_no] = approved;
    });
    setApprovals(newApprovals);
  };

  const applyUpdates = async () => {
    if (!matchData) return;

    try {
      setIsApplying(true);

      // Prepare update data (include approved records even if the DOCX degree is empty)
      const updates = matchData.matches
        .filter((item) => approvals[item.matric_no] === true)
        .map((item) => ({
          student_id: item.student_id,
          matric_no: item.matric_no,
          proposed_class_of_degree: item.proposed_class_of_degree ?? null,
          approved: true,
        }));

      if (updates.length === 0) {
        toast.error('No approved records selected. Please approve rows to update.');
        return;
      }

      const result = await adminService.applyGraduandsUpdates(updates, selectedFile);

      const updateResult = result.result;
      toast.success(
        `Updates applied successfully! ${updateResult.updated_count} records updated.`
      );

      if (updateResult.error_count > 0) {
        toast.warning(`${updateResult.error_count} records had errors.`);
      }

      // Refresh the matches to show updated state
      fetchMatches();
    } catch (error) {
      console.error("Error applying updates:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to apply updates"
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleBackToImport = () => {
    router.push("/admin/docx-import");
  };

  const handleUploadGraduands = async () => {
    if (!uploadFile) {
      toast.error("Please select a GRADUANDS .docx or .csv file to upload");
      return;
    }
    if (!uploadSessionId) {
      toast.error("Please select the NYSC session this file belongs to");
      return;
    }
    try {
      setIsUploading(true);
      const result = await adminService.uploadGraduandsFile(
        uploadFile,
        uploadSessionId,
        uploadGraduationDate || undefined
      );
      if (result.success) {
        toast.success(result.message);
        setUploadFile(null);
        setUploadGraduationDate("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setGraduandsFiles(result.files || []);
        if (result.file?.name) {
          setSelectedFile(result.file.name);
          setActiveTab("review");
          fetchMatches(result.file.name);
        }
      } else {
        toast.error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading graduands file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload graduands file"
      );
    } finally {
      setIsUploading(false);
    }
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

  const approvedCount = Object.values(approvals).filter(Boolean).length;

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    GRADUANDS Class of Degree Review
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review and approve class of degree updates from the
                    GRADUANDS.docx file
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        setIsEnforcePreviewing(true);
                        const fileToProcess = selectedFile;
                        toast.info(`Previewing enforcement for ${fileToProcess}...`);
                        const result = await adminService.enforceDegreesFromDocx(fileToProcess, { dry_run: true });
                        if (result.success) {
                          setEnforceStats(result.stats || {});
                          setEnforceDetails(result.details || {});
                          setShowEnforceConfirm(true);
                          toast.success('Preview ready');
                        } else {
                          toast.error(result.message || 'Preview failed');
                        }
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : 'Failed to preview enforcement'
                        );
                      } finally {
                        setIsEnforcePreviewing(false);
                      }
                    }}
                    variant="destructive"
                    size="sm"
                    disabled={isLoadingData || isProcessing || isEnforcePreviewing}
                  >
                    Preview Enforcement
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/'}api/nysc/admin/docx-import/test`,
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "nysc_token"
                              )}`,
                              Accept: "application/json",
                            },
                          }
                        );
                        const result = await response.json();
                        toast.success("API Connection: " + result.message);
                        console.log("API Test Result:", result);
                      } catch (error) {
                        toast.error(
                          "API Connection Failed: " +
                            (error instanceof Error
                              ? error.message
                              : "Unknown error")
                        );
                        console.error("API Test Error:", error);
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Test API
                  </Button>
                  <NyscExportButton size="sm" variant="outline" file={selectedFile} />
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/'}api/nysc/admin/docx-import/test-db-update`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "nysc_token"
                              )}`,
                              Accept: "application/json",
                              "Content-Type": "application/json",
                            },
                          }
                        );
                        const result = await response.json();
                        if (result.success) {
                          toast.success(
                            "DB Update Test: " +
                              (result.test_results.update_successful
                                ? "PASSED"
                                : "FAILED")
                          );
                          console.log("DB Test Result:", result.test_results);
                        } else {
                          toast.error("DB Test Failed: " + result.message);
                        }
                      } catch (error) {
                        toast.error(
                          "DB Test Error: " +
                            (error instanceof Error
                              ? error.message
                              : "Unknown error")
                        );
                        console.error("DB Test Error:", error);
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Test DB Update
                  </Button>
                  <Button
                    onClick={refreshMatches}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingData || isProcessing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isLoadingData || isProcessing ? "animate-spin" : ""
                      }`}
                    />
                    {isProcessing ? "Refreshing..." : "Refresh Matches"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("review")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "review"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Review & Files
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "upload"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Upload GRADUANDS File
              </button>
            </div>

            {activeTab === "upload" ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload GRADUANDS File
                    </CardTitle>
                    <CardDescription>
                      Upload a GRADUANDS .docx or .csv file (with MATRIC_NO and
                      CLASS_OF_DEGREE columns) and tie it to its NYSC session
                      and graduation date.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">
                          File
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".docx,.csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv"
                          onChange={(e) =>
                            setUploadFile(e.target.files?.[0] || null)
                          }
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">
                          NYSC Session
                        </label>
                        <select
                          value={uploadSessionId}
                          onChange={(e) =>
                            setUploadSessionId(
                              e.target.value ? Number(e.target.value) : ""
                            )
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select session...</option>
                          {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                              {s.is_active ? " (Active)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">
                          Graduation Date (optional)
                        </label>
                        <input
                          type="date"
                          value={uploadGraduationDate}
                          onChange={(e) =>
                            setUploadGraduationDate(e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleUploadGraduands}
                        disabled={isUploading}
                        size="sm"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Graduands Files
                    </CardTitle>
                    <CardDescription>
                      Files stored on the server and the session they belong
                      to.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {graduandsFiles.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No GRADUANDS files found in storage.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {graduandsFiles.map((file) => (
                          <div
                            key={file.name}
                            className="p-4 border rounded-lg"
                          >
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              Size: {file.size}
                            </div>
                            <div className="text-sm text-gray-500">
                              Session:{" "}
                              {file.session_name
                                ? file.session_name +
                                  (file.session_id
                                    ? ` (ID ${file.session_id})`
                                    : "")
                                : "Not assigned"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Graduation Date: {file.graduation_date || "Not set"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Modified:{" "}
                              {new Date(file.modified).toLocaleDateString()}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 w-full"
                              disabled={isLoadingData || isProcessing}
                              onClick={() => {
                                setSelectedFile(file.name);
                                setActiveTab("review");
                                fetchMatches(file.name);
                              }}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Scan & Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {error}
                </AlertDescription>
              </Alert>
            ) : matchData ? (
              <div className="space-y-6">
                {/* File Selection */}
                {matchData.summary.available_files &&
                  matchData.summary.available_files.length > 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Available GRADUANDS Files
                        </CardTitle>
                        <CardDescription>
                          Select a file to process. Large files are split for
                          better performance.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {matchData.summary.available_files.map((file) => (
                            <div
                              key={file.name}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                file.name === matchData.summary.current_file
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => {
                                setSelectedFile(file.name);
                                fetchMatches(file.name);
                              }}
                            >
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-gray-500">
                                Size: {file.size}
                              </div>
                              <div className="text-sm text-gray-500">
                                Modified:{" "}
                                {new Date(file.modified).toLocaleDateString()}
                              </div>
                              {file.name === matchData.summary.current_file && (
                                <div className="text-sm text-blue-600 font-medium mt-1">
                                  Currently Active
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      GRADUANDS Matching Results
                    </CardTitle>
                    <CardDescription>
                      Students with NULL class_of_degree matched with{" "}
                      {matchData.summary.current_file}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Current File
                        </p>
                        <p className="text-lg font-semibold">
                          {matchData.summary.current_file}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Last Modified
                        </p>
                        <p className="text-lg font-semibold">
                          {new Date(
                            matchData.summary.file_last_modified
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Status
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Live Matching
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          NULL Degrees
                        </p>
                        <p className="text-lg font-semibold">
                          {matchData.summary.total_students_with_null_degree}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Exact Matches
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {matchData.summary.exact_matches || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Similar Matches
                      </CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {matchData.summary.similar_matches || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Matches
                      </CardTitle>
                      <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {matchData.summary.total_matches_found}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Unmatched Records
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {matchData.summary.total_unmatched}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {showEnforceConfirm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Confirm Enforcement
                      </CardTitle>
                      <CardDescription>
                        Includes exact and similar matric matches (by final number). Values not tied to the file will be nullified; mismatches will be updated to match the file.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Scanned</p>
                          <p className="text-lg font-semibold">{enforceStats?.scanned ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Kept OK</p>
                          <p className="text-lg font-semibold text-green-700">{enforceStats?.kept_ok ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nullify (not in DOCX)</p>
                          <p className="text-lg font-semibold text-red-700">{enforceStats?.nullified_not_in_docx ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Update To DOCX</p>
                          <p className="text-lg font-semibold text-indigo-700">{enforceStats?.updated_to_docx ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Already NULL</p>
                          <p className="text-lg font-semibold">{enforceStats?.already_null ?? 0}</p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-2">Preview (first 100)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-red-700">Not In DOCX ({enforceDetails?.not_in_docx?.length || 0})</p>
                            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-red-50">
                              {(enforceDetails?.not_in_docx || []).slice(0, 100).map((r, i) => (
                                <div key={`nid-${i}`} className="text-xs py-1 border-b flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedActions[`nid-${r.student_id}`]?.selected}
                                    onChange={(e) => {
                                      setSelectedActions((prev) => ({
                                        ...prev,
                                        [`nid-${r.student_id}`]: { selected: e.target.checked, action: 'nullify' }
                                      }))
                                    }}
                                  />
                                  <span className="font-mono">{r.matric_no}</span> — {r.name} — <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">{r.current_class_of_degree}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-indigo-700">Updated To DOCX ({enforceDetails?.updated_to_docx?.length || 0})</p>
                            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-indigo-50">
                              {(enforceDetails?.updated_to_docx || []).slice(0, 100).map((r, i) => {
                                const key = `upd-${r.student_id}`;
                                const act = selectedActions[key]?.action || 'update';
                                return (
                                  <div key={key} className="text-xs py-1 border-b flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!selectedActions[key]?.selected}
                                      onChange={(e) => {
                                        setSelectedActions((prev) => ({
                                          ...prev,
                                          [key]: { selected: e.target.checked, action: prev[key]?.action || 'update', value: r.docx_class_of_degree }
                                        }))
                                      }}
                                    />
                                    <button
                                      className={`px-2 py-0.5 rounded ${act === 'update' ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}
                                      onClick={() => {
                                        setSelectedActions((prev) => ({
                                          ...prev,
                                          [key]: { selected: prev[key]?.selected || false, action: act === 'update' ? 'nullify' : 'update', value: r.docx_class_of_degree }
                                        }))
                                      }}
                                    >
                                      {act === 'update' ? 'Update' : 'Nullify'}
                                    </button>
                                    <span className="font-mono">{r.matric_no}</span> — {r.name} — DB: <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{r.current_class_of_degree}</span> → DOCX: <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">{r.docx_class_of_degree}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <Button
                          onClick={async () => {
                            try {
                              setIsProcessing(true);
                              const fileToProcess = selectedFile;
                              const ops: any[] = [];
                              (enforceDetails?.not_in_docx || []).forEach((r: any) => {
                                const k = `nid-${r.student_id}`;
                                if (selectedActions[k]?.selected) {
                                  ops.push({ student_id: r.student_id, matric_no: r.matric_no, action: 'nullify' });
                                }
                              });
                              (enforceDetails?.updated_to_docx || []).forEach((r: any) => {
                                const k = `upd-${r.student_id}`;
                                if (selectedActions[k]?.selected) {
                                  ops.push({ student_id: r.student_id, matric_no: r.matric_no, action: selectedActions[k].action, value: r.docx_class_of_degree });
                                }
                              });
                              const result = await adminService.enforceDegreesFromDocx(fileToProcess, undefined, ops);
                              if (result.success) {
                                const s = result.stats || {};
                                toast.success(
                                  `Enforcement done. Kept: ${s.kept_ok || 0}, Nullified (not in docx): ${s.nullified_not_in_docx || 0}, Updated to DOCX: ${s.updated_to_docx || 0}`
                                );
                                setShowEnforceConfirm(false);
                                setEnforceStats(null);
                                await fetchMatches(selectedFile);
                              } else {
                                toast.error(result.message || 'Enforcement failed');
                              }
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : 'Failed to enforce degrees'
                              );
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                        >
                          Apply Selected Actions
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEnforceConfirm(false);
                            setEnforceStats(null);
                            setSelectedActions({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Unmatched Records Section */}
                {matchData.unmatched && matchData.unmatched.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Unmatched Records ({matchData.summary.total_unmatched})
                      </CardTitle>
                      <CardDescription>
                        Records from DOCX that could not be matched with
                        database. Check for formatting differences.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {matchData.unmatched
                            .slice(0, 30)
                            .map((record, index) => (
                              <div
                                key={index}
                                className="p-2 bg-orange-50 rounded border text-sm"
                              >
                                <div className="font-mono text-xs">
                                  <strong>DOCX:</strong> {record.docx_matric}
                                </div>
                                <div className="font-mono text-xs text-gray-600">
                                  <strong>Normalized:</strong>{" "}
                                  {record.normalized_matric}
                                </div>
                                <div className="text-xs text-gray-700">
                                  <strong>Degree:</strong>{" "}
                                  {record.class_of_degree}
                                </div>
                              </div>
                            ))}
                        </div>
                        {matchData.unmatched.length > 30 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Showing first 30 of {matchData.unmatched.length}{" "}
                            unmatched records
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Review Table */}
                {matchData.matches.length > 0 ? (
                  <>
                    <ImportReviewTable
                      data={matchData.matches.map((item) => ({
                        ...item,
                        approved: approvals[item.matric_no] || false,
                      }))}
                      onApprovalChange={handleApprovalChange}
                      onBulkApproval={handleBulkApproval}
                      isLoading={isApplying}
                    />

                    {/* Apply Updates Button */}
                    {approvedCount > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">
                                Apply Updates
                              </h3>
                              <p className="text-gray-600">
                                {approvedCount} record
                                {approvedCount !== 1 ? "s" : ""} selected for
                                update
                              </p>
                            </div>
                            <Button
                              onClick={applyUpdates}
                              disabled={isApplying}
                              size="lg"
                            >
                              {isApplying ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Applying Updates...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Apply {approvedCount} Update
                                  {approvedCount !== 1 ? "s" : ""}
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No matching records found in the processed file.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No session data available. Try processing the GRADUANDS file
                  first.
                </AlertDescription>
              </Alert>
            )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default GraduandsReviewPage;
