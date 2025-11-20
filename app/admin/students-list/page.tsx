"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Search,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import adminService from "@/services/admin.service";

interface Student {
  id: number;
  matric_no: string;
  fname: string;
  mname: string;
  lname: string;
  phone: string;
  state: string;
  class_of_degree: string;
  dob: string;
  graduation_year: string;
  gender: string;
  marital_status: string;
  jamb_no: string;
  course_study: string;
  study_mode: string;
}

interface StudentsListResponse {
  students: {
    data: Student[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  course_studies: string[];
  total_count: number;
}

const StudentsListPage = () => {
  const { userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [studentsData, setStudentsData] = useState<StudentsListResponse | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [courseStudyFilter, setCourseStudyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [sortBy, setSortBy] = useState("matric_no");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (!isLoading) {
      if (userType !== "admin") {
        router.push("/login");
        return;
      }

      // Temporarily remove permission check for testing
      // if (!hasPermission("canManageSystem")) {
      //   toast.error("You do not have permission to access this page");
      //   router.push("/admin");
      //   return;
      // }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    if (userType === "admin") {
      fetchStudents();
    }
  }, [
    userType,
    hasPermission,
    currentPage,
    perPage,
    courseStudyFilter,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  // Keyboard shortcuts for export
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+E for Excel export, Ctrl+Shift+E for CSV export
      if (
        event.ctrlKey &&
        event.key === "e" &&
        !isExporting &&
        studentsData?.students.total
      ) {
        event.preventDefault();
        if (event.shiftKey) {
          handleExport("csv");
          toast.info("Keyboard shortcut: Ctrl+Shift+E for CSV export");
        } else {
          handleExport("excel");
          toast.info("Keyboard shortcut: Ctrl+E for Excel export");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExporting, studentsData?.students.total]);

  const fetchStudents = async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      const filters = {
        course_study: courseStudyFilter,
        search: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const result = await adminService.getStudentsList(
        currentPage,
        perPage,
        filters
      );
      setStudentsData(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load students";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCourseStudyFilter = (value: string) => {
    setCourseStudyFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      setIsExporting(true);

      // Show initial toast
      const exportCount = studentsData?.students.total || 0;
      const courseText =
        courseStudyFilter !== "all"
          ? ` from ${courseStudyFilter}`
          : " from all courses";
      toast.info(
        `Preparing to export ${exportCount} students${courseText} as ${format.toUpperCase()}...`
      );

      const filters = {
        course_study: courseStudyFilter,
        format: format,
      };

      const blob = await adminService.exportStudentsList(filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate descriptive filename
      const courseStudyText =
        courseStudyFilter !== "all"
          ? `_${courseStudyFilter.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`
          : "_all_courses";
      const dateText = new Date().toISOString().split("T")[0];
      const timeText = new Date()
        .toTimeString()
        .split(" ")[0]
        .replace(/:/g, "");
      const filename = `students_list${courseStudyText}_${dateText}_${timeText}.${
        format === "excel" ? "xlsx" : "csv"
      }`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `✅ Successfully exported ${exportCount} students${courseText} as ${format.toUpperCase()}!\nFile: ${filename}`
      );
    } catch (error) {
      console.error("Export error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Export failed";
      toast.error(`❌ Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear().toString(); // Full 4-digit year
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatProperCase = (text: string) => {
    if (!text) return "";

    const words = text.toLowerCase().split(/[\s\-_\/]+/);
    const upperWords = [
      "IT",
      "ICT",
      "BSC",
      "MSC",
      "PHD",
      "BA",
      "MA",
      "HND",
      "OND",
      "NCE",
    ];
    const lowerWords = [
      "of",
      "and",
      "in",
      "the",
      "for",
      "with",
      "to",
      "at",
      "by",
    ];

    return words
      .map((word, index) => {
        if (!word) return "";

        if (upperWords.includes(word.toUpperCase())) {
          return word.toUpperCase();
        } else if (lowerWords.includes(word.toLowerCase()) && index > 0) {
          return word.toLowerCase();
        } else {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      })
      .join(" ");
  };

  const formatMatricNo = (matricNo: string) => {
    return matricNo ? matricNo.toUpperCase() : "";
  };

  const formatGender = (gender: string) => {
    if (!gender) return "";
    const g = gender.toLowerCase().trim();
    if (g === "male" || g === "m") return "M";
    if (g === "female" || g === "f") return "F";
    return gender.toUpperCase().charAt(0); // Fallback to first letter uppercase
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

        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Students List
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    View and export students with class of degree information
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={fetchStudents}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingData}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isLoadingData ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <Card className="mb-6 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Export Students Data
                </CardTitle>
                <CardDescription>
                  Export filtered students data in CSV or Excel format
                  {courseStudyFilter !== "all" && (
                    <span className="font-medium text-blue-700">
                      {" "}
                      • Currently filtered by: {courseStudyFilter}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Export will include:</strong>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>
                        • {studentsData?.students.total || 0} students{" "}
                        {courseStudyFilter !== "all"
                          ? `from ${courseStudyFilter}`
                          : "from all courses"}
                      </div>
                      <div>
                        • All 14 fields: matric_no, names, phone, state,
                        class_of_degree, dob, graduation_year, gender,
                        marital_status, jamb_no, course_study, study_mode
                      </div>
                      <div>
                        • Phone, DOB, and graduation year formatted as text (not
                        numbers/dates)
                      </div>
                      <div className="text-blue-600">
                        • Keyboard shortcuts: Ctrl+E (Excel), Ctrl+Shift+E (CSV)
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleExport("csv")}
                      variant="outline"
                      disabled={
                        isExporting ||
                        isLoadingData ||
                        !studentsData?.students.total
                      }
                      className="min-w-[120px]"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleExport("excel")}
                      disabled={
                        isExporting ||
                        isLoadingData ||
                        !studentsData?.students.total
                      }
                      className="min-w-[120px]"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {courseStudyFilter !== "all" && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Filter className="h-4 w-4" />
                      <span className="font-medium">Active Filter:</span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-200 text-blue-800"
                      >
                        {courseStudyFilter}
                      </Badge>
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Only students from {courseStudyFilter} will be exported.
                      <button
                        onClick={() => setCourseStudyFilter("all")}
                        className="ml-1 underline hover:no-underline"
                      >
                        Clear filter to export all courses
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
                <CardDescription>
                  Filter students by course of study and search by name or
                  matric number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Course of Study
                    </label>
                    <Select
                      value={courseStudyFilter}
                      onValueChange={handleCourseStudyFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {studentsData?.course_studies.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name or matric number..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Per Page
                    </label>
                    <Select
                      value={perPage.toString()}
                      onValueChange={(value) => {
                        setPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            {studentsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Students
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {studentsData.total_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      With class of degree
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Filtered Results
                    </CardTitle>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {studentsData.students.total}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Matching current filters
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={
                    courseStudyFilter !== "all"
                      ? "border-blue-200 bg-blue-50/30"
                      : ""
                  }
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {courseStudyFilter !== "all"
                        ? "Export Ready"
                        : "Course Studies"}
                    </CardTitle>
                    {courseStudyFilter !== "all" ? (
                      <Download className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Badge variant="secondary">
                        {studentsData.course_studies.length}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {courseStudyFilter !== "all" ? (
                      <>
                        <div className="text-2xl font-bold text-blue-600">
                          {studentsData.students.total}
                        </div>
                        <p className="text-xs text-blue-700">
                          Students ready for export
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">
                          {studentsData.course_studies.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Available courses
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Students Table */}
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : studentsData && studentsData.students.data.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                  <CardDescription>
                    Showing {studentsData.students.data.length} of{" "}
                    {studentsData.students.total} students
                    {courseStudyFilter !== "all" && ` in ${courseStudyFilter}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("matric_no")}
                          >
                            Matric No{" "}
                            {sortBy === "matric_no" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("fname")}
                          >
                            First Name{" "}
                            {sortBy === "fname" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead>Middle Name</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("lname")}
                          >
                            Last Name{" "}
                            {sortBy === "lname" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("class_of_degree")}
                          >
                            Class of Degree{" "}
                            {sortBy === "class_of_degree" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead>DOB</TableHead>
                          <TableHead>Graduation Year</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Marital Status</TableHead>
                          <TableHead>JAMB No</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("course_study")}
                          >
                            Course Study{" "}
                            {sortBy === "course_study" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead>Study Mode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsData.students.data.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium font-mono">
                              {formatMatricNo(student.matric_no)}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.fname)}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.mname)}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.lname)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {student.phone}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.state)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatProperCase(student.class_of_degree)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(student.dob)}</TableCell>
                            <TableCell>{student.graduation_year}</TableCell>
                            <TableCell className="font-medium">
                              {formatGender(student.gender)}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.marital_status)}
                            </TableCell>
                            <TableCell className="font-medium font-mono">
                              {formatMatricNo(student.jamb_no)}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.course_study)}
                            </TableCell>
                            <TableCell>
                              {formatProperCase(student.study_mode)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {studentsData.students.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Page {studentsData.students.current_page} of{" "}
                        {studentsData.students.last_page}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={
                            currentPage === studentsData.students.last_page
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertDescription>
                  No students found with the current filters.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </main>

        {/* Floating Export Button */}
        {studentsData && studentsData.students.total > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex flex-col gap-2">
              {/* Quick Export Buttons */}
              <div className="bg-white rounded-lg shadow-lg border p-3 space-y-2">
                <div className="text-xs font-medium text-gray-600 text-center">
                  Quick Export
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExport("csv")}
                    size="sm"
                    variant="outline"
                    disabled={isExporting || isLoadingData}
                    className="min-w-[80px]"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => handleExport("excel")}
                    size="sm"
                    disabled={isExporting || isLoadingData}
                    className="min-w-[80px]"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Excel
                  </Button>
                </div>
                {courseStudyFilter !== "all" && (
                  <div className="text-xs text-blue-600 text-center">
                    {courseStudyFilter}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default StudentsListPage;
