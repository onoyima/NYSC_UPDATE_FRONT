"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import NerdReviewTable, { NerdReviewData } from "@/components/admin/NerdReviewTable";
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
  Users,
  Upload,
  Search,
  Download,
  Brain,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import adminService from "@/services/admin.service";

interface NerdFile {
  name: string;
  size: string;
  modified: string;
  session_id?: number | null;
  session_name?: string | null;
  graduation_session?: string | null;
  graduation_date?: string | null;
}

interface NerdMatchData {
  success: boolean;
  summary: {
    total_students: number;
    total_extracted_from_file: number;
    total_matches_found: number;
    exact_matches: number;
    similar_matches: number;
    total_unmatched: number;
    current_file: string | null;
    available_files: NerdFile[];
    file_last_modified: string | null;
  };
  matches: NerdReviewData[];
  unmatched: Array<{
    docx_matric: string;
    normalized_matric: string;
    class_of_degree: string;
    final_cgpa: number | string | null;
    student_name?: string;
  }>;
  message: string;
}

const NerdReviewPage = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [matchData, setMatchData] = useState<NerdMatchData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"review" | "upload">("review");
  const [sessions, setSessions] = useState<any[]>([]);
  const [nerdFiles, setNerdFiles] = useState<NerdFile[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<number | "">("");
  const [uploadGraduationSession, setUploadGraduationSession] = useState<string>("");
  const [uploadGraduationDate, setUploadGraduationDate] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
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
        await Promise.allSettled([
          adminService.getSessions().then((res: any) => {
            if (res.success) {
              setSessions(res.sessions || []);
              if (!uploadSessionId && res.active_session_id) {
                setUploadSessionId(res.active_session_id);
              }
            }
          }),
          adminService.getNerdFiles().then((res: any) => {
            if (res.success) {
              setNerdFiles(res.files || []);
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

      const fileToProcess = fileName || selectedFile || undefined;
      const result = await adminService.getNerdReviewMatches(fileToProcess);

      if (!result.success) {
        setMatchData(result);
        const msg = result.message || "Failed to process the nerd file";
        setError(msg);
        toast.error(msg);
        return;
      }

      setMatchData(result);

      const initialApprovals: Record<string, boolean> = {};
      result.matches.forEach((item: NerdReviewData) => {
        initialApprovals[item.matric_no] = false;
      });
      setApprovals(initialApprovals);

      if (result.summary?.current_file) {
        setSelectedFile(result.summary.current_file);
      }

      toast.success(
        `Found ${result.matches.length} matches (${result.summary.exact_matches || 0} exact, ${result.summary.similar_matches || 0} similar), ${result.summary.total_unmatched} unmatched records`
      );
    } catch (err) {
      console.error("Error fetching nerd matches:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load matches";
      if (errorMessage.includes("timeout")) {
        toast.error(
          "Processing timeout - the nerd file might be too large. Please try again or contact support."
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
      toast.info("Refreshing matches...");
      await fetchMatches(selectedFile || undefined);
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

  const downloadUnmatched = () => {
    if (!matchData || matchData.unmatched.length === 0) {
      toast.error("No unmatched records to download");
      return;
    }

    const header = "Matric_No,Student_Name,Class_of_Degree,Final_CGPA";
    const rows = matchData.unmatched.map((record) => {
      const matric = `"${(record.docx_matric || "").replace(/"/g, '""')}"`;
      const name = `"${(record.student_name || "").replace(/"/g, '""')}"`;
      const degree = `"${(record.class_of_degree || "").replace(/"/g, '""')}"`;
      const cgpa = `"${(record.final_cgpa ?? "").toString().replace(/"/g, '""')}"`;
      return `${matric},${name},${degree},${cgpa}`;
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    link.download = `nerd_unmatched_records_${timestamp}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded ${matchData.unmatched.length} unmatched records`);
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

      const updates = matchData.matches
        .filter((item) => approvals[item.matric_no] === true)
        .map((item) => ({
          student_id: item.student_id,
          matric_no: item.matric_no,
          proposed_cgpa: item.proposed_cgpa ?? null,
          proposed_class_of_degree: item.proposed_class_of_degree ?? null,
          proposed_programme: item.proposed_programme ?? null,
          proposed_graduation_date: item.proposed_graduation_date ?? null,
          proposed_graduation_session: item.proposed_graduation_session ?? null,
          approved: true,
        }));

      if (updates.length === 0) {
        toast.error('No approved records selected. Please approve rows to update.');
        return;
      }

      const result = await adminService.applyNerdUpdates(updates, selectedFile || undefined);

      const updateResult = result.result;
      toast.success(
        `Updates applied successfully! ${updateResult.updated_count} records updated.`
      );

      if (updateResult.error_count > 0) {
        toast.warning(`${updateResult.error_count} records had errors.`);
      }

      fetchMatches();
    } catch (error) {
      console.error("Error applying nerd updates:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to apply updates"
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleUploadNerd = async () => {
    if (!uploadFile) {
      toast.error("Please select a nerd .csv or .docx file to upload");
      return;
    }
    if (!uploadSessionId) {
      toast.error("Please select the NYSC session this file belongs to");
      return;
    }
    if (!uploadGraduationSession) {
      toast.error("Please enter the graduation session (e.g. 2024/2025)");
      return;
    }
    if (!uploadGraduationDate) {
      toast.error("Please select the graduation date");
      return;
    }
    try {
      setIsUploading(true);
      const result = await adminService.uploadNerdFile(
        uploadFile,
        uploadSessionId,
        uploadGraduationSession,
        uploadGraduationDate || undefined
      );
      if (result.success) {
        toast.success(result.message);
        setUploadFile(null);
        setUploadGraduationSession("");
        setUploadGraduationDate("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setNerdFiles(result.files || []);
        if (result.file?.name) {
          setSelectedFile(result.file.name);
          setActiveTab("review");
          fetchMatches(result.file.name);
        }
      } else {
        toast.error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading nerd file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload nerd file"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNerdFile = async (fileName: string) => {
    if (fileToDelete) return;
    setFileToDelete(fileName);
    try {
      const result = await adminService.deleteNerdFile(fileName);
      if (result.success) {
        toast.success(result.message);
        setNerdFiles(result.files || []);
        if (selectedFile === fileName) {
          setSelectedFile("");
          setMatchData(null);
        }
      } else {
        toast.error(result.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting nerd file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete nerd file"
      );
    } finally {
      setFileToDelete(null);
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
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <Brain className="h-8 w-8 text-purple-600" />
                    Nerd Review
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review and approve Final CGPA, Class of Degree, Graduation
                    Date and Graduation Session updates from an uploaded nerd file
                    (updates only the nerd table, not the NYSC table)
                  </p>
                </div>

                <div className="flex gap-2">
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
                Upload Nerd File
              </button>
            </div>

            {activeTab === "upload" ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Nerd File
                    </CardTitle>
                    <CardDescription>
                      Upload a nerd .csv or .docx file (with MATRIC_NO, and
                      optional FINAL_CGPA and CLASS_OF_DEGREE columns). Graduation
                      session and graduation date are set for the whole file at
                      upload time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          Graduation Session
                        </label>
                        <input
                          type="text"
                          value={uploadGraduationSession}
                          onChange={(e) =>
                            setUploadGraduationSession(e.target.value)
                          }
                          placeholder="e.g. 2024/2025"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">
                          Graduation Date
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
                        onClick={handleUploadNerd}
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
                      Nerd Files
                    </CardTitle>
                    <CardDescription>
                      Files stored on the server and the session they belong to.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {nerdFiles.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No nerd files found in storage.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nerdFiles.map((file) => (
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
                              Graduation Session: {file.graduation_session || "Not set"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Graduation Date: {file.graduation_date || "Not set"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Modified:{" "}
                              {new Date(file.modified).toLocaleDateString()}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
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
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={fileToDelete === file.name}
                                onClick={() => handleDeleteNerdFile(file.name)}
                              >
                                {fileToDelete === file.name ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
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
                              Available Nerd Files
                            </CardTitle>
                            <CardDescription>
                              Select a file to process.
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
                                  <div className="text-sm text-gray-500">
                                    Session: {file.session_name || "Not assigned"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Grad Session: {file.graduation_session || "—"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Grad Date: {file.graduation_date || "—"}
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

                    {/* Session Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Nerd Matching Results
                        </CardTitle>
                        <CardDescription>
                          Matched against {matchData.summary.current_file}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              {matchData.summary.file_last_modified
                                ? new Date(
                                    matchData.summary.file_last_modified
                                  ).toLocaleString()
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Records Extracted From File
                            </p>
                            <p className="text-lg font-semibold">
                              {matchData.summary.total_extracted_from_file}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Unmatched Records Section */}
                    {matchData.unmatched && matchData.unmatched.length > 0 && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                                Unmatched Records ({matchData.summary.total_unmatched})
                              </CardTitle>
                              <CardDescription>
                                Records from the nerd file that could not be
                                matched with the database.
                              </CardDescription>
                            </div>
                            <Button
                              onClick={downloadUnmatched}
                              variant="outline"
                              size="sm"
                              disabled={matchData.unmatched.length === 0}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download CSV
                            </Button>
                          </div>
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
                                      <strong>File:</strong> {record.docx_matric}
                                    </div>
                                    <div className="font-mono text-xs text-gray-600">
                                      <strong>Normalized:</strong>{" "}
                                      {record.normalized_matric}
                                    </div>
                                    <div className="text-xs text-gray-700">
                                      <strong>Degree:</strong>{" "}
                                      {record.class_of_degree || "—"}
                                    </div>
                                    <div className="text-xs text-gray-700">
                                      <strong>CGPA:</strong>{" "}
                                      {record.final_cgpa ?? "—"}
                                    </div>
                                  </div>
                                ))}
                            </div>
                            {matchData.unmatched.length > 30 && (
                              <p className="text-sm text-gray-500 mt-2">
                                Showing first 30 of{" "}
                                {matchData.unmatched.length} unmatched records
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Review Table */}
                    {matchData.matches.length > 0 ? (
                      <>
                        <NerdReviewTable
                          data={matchData.matches.map((item) => ({
                            ...item,
                            approved: approvals[item.matric_no] || false,
                          }))}
                          onApprovalChange={handleApprovalChange}
                          onBulkApproval={handleBulkApproval}
                          isLoading={isApplying}
                        />

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
                      No nerd file available. Upload a nerd file first.
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

export default NerdReviewPage;