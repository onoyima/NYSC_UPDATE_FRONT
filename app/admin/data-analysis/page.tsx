"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { adminService } from "@/services/admin.service";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Database,
  TrendingUp,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface DataAnalysisStats {
  total_students_in_db: number;
  students_with_null_degree: number;
  students_with_class_degree: number;
  total_in_graduands_file: number;
  graduands_file_exists: boolean;
  graduands_last_modified: string;
  matched_records: number;
  unmatched_from_db: number;
  unmatched_from_graduands: number;
  match_percentage: number;
  null_degree_students: Array<{
    id: number;
    matric_no: string;
    fname: string;
    lname: string;
    mname: string;
    department: string;
  }>;
  unmatched_graduands: Array<{
    matric_no: string;
    normalized_matric: string;
    class_of_degree: string;
    student_name: string;
  }>;

  similar_matches: Array<{
    graduands_matric: string;
    db_matric: string;
    similarity_type: string;
    class_of_degree: string;
    student_name: string;
  }>;
}

export default function DataAnalysisPage() {
  const { userType, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DataAnalysisStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (userType !== "admin") {
        router.push("/login");
        return;
      }
    }
  }, [userType, isLoading, router]);

  useEffect(() => {
    if (userType === "admin") {
      fetchAnalysisData();
    }
  }, [userType]);

  const fetchAnalysisData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      const data = await adminService.getDataAnalysis();
      setStats(data);
      toast.success("Data analysis loaded successfully");
    } catch (error) {
      console.error("Error fetching analysis data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const exportNullDegreeStudents = () => {
    const link = document.createElement("a");
    link.href = "http://localhost:8000/api/nysc/export-null-degree-students";
    link.download = `null_degree_students_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export started");
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
            <div className="mb-8">
              <PageHeader
                title="Data Analysis & Statistics"
                description="Comprehensive analysis of student data, GRADUANDS file, and matching statistics"
                icon={<BarChart3 className="h-6 w-6" />}
              />

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={fetchAnalysisData}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingData}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isLoadingData ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Data
                </Button>
                <Button
                  onClick={exportNullDegreeStudents}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export NULL Degrees
                </Button>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Students in DB
                      </CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.total_students_in_db}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        In student_nysc table
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        GRADUANDS Records
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.total_in_graduands_file}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.graduands_file_exists
                          ? "File exists"
                          : "File not found"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Match Rate
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.match_percentage.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.matched_records} matched records
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        NULL Class of Degree
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">
                        {stats.students_with_null_degree}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Need class of degree
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Students with NULL Class of Degree (
                      {stats.students_with_null_degree})
                    </CardTitle>
                    <CardDescription>
                      Students in the database who are missing their class of
                      degree information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.null_degree_students.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Matric Number</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Department</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.null_degree_students
                              .slice(0, 50)
                              .map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-mono">
                                    {student.matric_no}
                                  </TableCell>
                                  <TableCell>
                                    {`${student.fname} ${student.mname || ""} ${
                                      student.lname
                                    }`.trim()}
                                  </TableCell>
                                  <TableCell>
                                    {student.department || "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                        {stats.null_degree_students.length > 50 && (
                          <p className="text-sm text-muted-foreground mt-4 text-center">
                            Showing first 50 of{" "}
                            {stats.null_degree_students.length} records.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                        All students have class of degree information!
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      Unmatched Records from GRADUANDS File (
                      {stats.unmatched_from_graduands})
                    </CardTitle>
                    <CardDescription>
                      Records from GRADUANDS.docx that could not be matched with
                      database records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.unmatched_graduands.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Original Matric No</TableHead>
                              <TableHead>Normalized Matric No</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Class of Degree</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.unmatched_graduands
                              .slice(0, 50)
                              .map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono">
                                    {record.matric_no}
                                  </TableCell>
                                  <TableCell className="font-mono text-muted-foreground">
                                    {record.normalized_matric}
                                  </TableCell>
                                  <TableCell>{record.student_name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {record.class_of_degree}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                        {stats.unmatched_graduands.length > 50 && (
                          <p className="text-sm text-muted-foreground mt-4 text-center">
                            Showing first 50 of{" "}
                            {stats.unmatched_graduands.length} unmatched records
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                        All GRADUANDS records matched with database!
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No data available. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
