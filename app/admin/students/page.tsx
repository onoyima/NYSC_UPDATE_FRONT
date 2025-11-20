'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import adminService from '@/services/admin.service';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  GraduationCap,
  CreditCard,
  FileText,
  ArrowLeft,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Student {
  id: string;
  student_id: string;
  fname: string;
  lname: string;
  mname?: string;
  student_name: string;
  email: string;
  phone: string;
  matric_no: string;
  department: string;
  course_of_study: string;
  graduation_year: string;
  cgpa: string;
  gender: string;
  state_of_origin: string;
  lga: string;
  institution: string;
  is_submitted: boolean;
  is_paid: boolean;
  payment_amount: number | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

interface StudentStats {
  total_students: number;
  submitted_applications: number;
  paid_students: number;
  pending_payments: number;
}

const StudentsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await adminService.getAllStudents();
      // Backend returns { success: true, data: students[], total: number }
      setStudents(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminService.getStudentStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStudents(), fetchStats()]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(paginatedStudents.map(student => student.id));
      setSelectAll(true);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        const newSelected = prev.filter(id => id !== studentId);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, studentId];
        setSelectAll(newSelected.length === paginatedStudents.length);
        return newSelected;
      }
    });
  };

  const handleBulkExport = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students to export');
      return;
    }
    const selectedData = students.filter(student => selectedStudents.includes(student.id));
    exportToCSV(selectedData, 'selected_students.csv');
  };

  const handleExportAll = () => {
    exportToCSV(students, 'all_students.csv');
  };

  const exportToCSV = (data: Student[], filename: string) => {
    const headers = [
      'ID',
      'Student ID', 
      'First Name',
      'Last Name',
      'Middle Name',
      'Full Name',
      'Email',
      'Phone',
      'Matric Number',
      'Department',
      'Course of Study',
      'Graduation Year',
      'CGPA',
      'Gender',
      'State of Origin',
      'LGA',
      'Institution',
      'Submitted',
      'Payment Status',
      'Payment Amount',
      'Payment Date',
      'Created At',
      'Updated At'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(student => [
        student.id,
        student.student_id,
        student.fname,
        student.lname,
        student.mname || '',
        student.student_name,
        student.email,
        student.phone,
        student.matric_no,
        student.department,
        student.course_of_study,
        student.graduation_year,
        student.cgpa,
        student.gender,
        student.state_of_origin,
        student.lga,
        student.institution,
        student.is_submitted ? 'Yes' : 'No',
        student.is_paid ? 'Paid' : 'Unpaid',
        student.payment_amount || '',
        student.payment_date || '',
        formatDate(student.created_at),
        formatDate(student.updated_at)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${data.length} student records to ${filename}`);
  };

  const viewStudentDetails = async (studentId: string) => {
    try {
      const response = await adminService.getStudentDetails(studentId);
      setSelectedStudent(response.data);
      setIsDialogOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch student details');
    }
  };



  // Filter, sort and paginate students with useMemo for performance
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = (students || []).filter(student => {
      const matchesSearch = searchTerm === '' || 
        (student.fname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.lname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.matric_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.institution || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.course_of_study || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'submitted' && student.is_submitted) ||
        (statusFilter === 'pending' && !student.is_submitted);
      
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'paid' && student.is_paid) ||
        (paymentFilter === 'unpaid' && !student.is_paid);
      
      const matchesDepartment = departmentFilter === 'all' || 
        student.department === departmentFilter;
      
      const matchesGender = genderFilter === 'all' || 
        student.gender === genderFilter;
      
      return matchesSearch && matchesStatus && matchesPayment && matchesDepartment && matchesGender;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = (a.student_name || `${a.fname} ${a.lname}`).toLowerCase();
          bValue = (b.student_name || `${b.fname} ${b.lname}`).toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'matric_no':
          aValue = (a.matric_no || '').toLowerCase();
          bValue = (b.matric_no || '').toLowerCase();
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'course_of_study':
          aValue = (a.course_of_study || '').toLowerCase();
          bValue = (b.course_of_study || '').toLowerCase();
          break;
        case 'gender':
          aValue = (a.gender || '').toLowerCase();
          bValue = (b.gender || '').toLowerCase();
          break;
        case 'cgpa':
          aValue = parseFloat(a.cgpa) || 0;
          bValue = parseFloat(b.cgpa) || 0;
          break;
        case 'state_of_origin':
          aValue = (a.state_of_origin || '').toLowerCase();
          bValue = (b.state_of_origin || '').toLowerCase();
          break;
        case 'institution':
          aValue = (a.institution || '').toLowerCase();
          bValue = (b.institution || '').toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'payment_status':
          aValue = a.is_paid ? 1 : 0;
          bValue = b.is_paid ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchTerm, statusFilter, paymentFilter, departmentFilter, genderFilter, sortField, sortDirection]);

  // Get unique departments and genders for filter options
  const uniqueDepartments = useMemo(() => {
    const departments = students.map(s => s.department).filter(Boolean);
    return Array.from(new Set(departments)).sort();
  }, [students]);

  const uniqueGenders = useMemo(() => {
    const genders = students.map(s => s.gender).filter(Boolean);
    return Array.from(new Set(genders)).sort();
  }, [students]);

  const paginatedStudents = filteredAndSortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);

  // Reset to first page when filters change and clear selections
  useEffect(() => {
    setCurrentPage(1);
    setSelectedStudents([]);
    setSelectAll(false);
  }, [searchTerm, statusFilter, paymentFilter, sortField, sortDirection]);

  // Update selectAll state when paginated students change
  useEffect(() => {
    if (paginatedStudents.length > 0) {
      const allSelected = paginatedStudents.every(student => selectedStudents.includes(student.id));
      setSelectAll(allSelected && selectedStudents.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [paginatedStudents, selectedStudents]);

  const getStatusBadge = (student: Student) => {
    if (student.is_paid) {
      return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
    } else if (student.is_submitted) {
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Submitted</Badge>;
    } else {
      return <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  const getPaymentBadge = (student: Student) => {
    if (student.is_paid) {
      return <Badge className="bg-green-600">Paid</Badge>;
    } else {
      return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner 
          size="xl" 
          text="Loading students data..."
          className="animate-scale-in"
        />
      </div>
    );
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Navbar */}
        <Navbar userType="admin" />
        
        {/* Main Content */}
        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Students Management</h1>
                  <p className="text-muted-foreground">
                    Manage and monitor student updates and payments.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleExportAll}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                  </Button>

                  <Link href="/admin">
                    <Button variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_students}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Submitted Applications</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.submitted_applications}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Paid Students</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.paid_students}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pending_payments}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search Bar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, matric no, or institution..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full sm:w-auto"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Collapsible Filters */}
              {showFilters && (
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Application Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Payment Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Payments</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {uniqueDepartments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={genderFilter} onValueChange={setGenderFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          {uniqueGenders.map(gender => (
                            <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Items per page</Label>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 per page</SelectItem>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredAndSortedStudents.length} of {students.length} students
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Students Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                  <CardDescription>
                    Click on a student to view detailed information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                checked={selectAll && paginatedStudents.length > 0}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300"
                              />
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center gap-2">
                                Name
                                {getSortIcon('name')}
                              </div>
                            </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('matric_no')}
                          >
                            <div className="flex items-center gap-2">
                              Matric No
                              {getSortIcon('matric_no')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center gap-2">
                              Email
                              {getSortIcon('email')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('department')}
                          >
                            <div className="flex items-center gap-2">
                              Department
                              {getSortIcon('department')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('course_of_study')}
                          >
                            <div className="flex items-center gap-2">
                              Course
                              {getSortIcon('course_of_study')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('gender')}
                          >
                            <div className="flex items-center gap-2">
                              Gender
                              {getSortIcon('gender')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('cgpa')}
                          >
                            <div className="flex items-center gap-2">
                              CGPA
                              {getSortIcon('cgpa')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('state_of_origin')}
                          >
                            <div className="flex items-center gap-2">
                              State
                              {getSortIcon('state_of_origin')}
                            </div>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('payment_status')}
                          >
                            <div className="flex items-center gap-2">
                              Payment
                              {getSortIcon('payment_status')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center gap-2">
                              Updated
                              {getSortIcon('created_at')}
                            </div>
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paginatedStudents.map((student) => (
                            <TableRow key={student.id} className={selectedStudents.includes(student.id) ? 'bg-muted/50' : ''}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={() => handleSelectStudent(student.id)}
                                  className="rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.student_name || `${student.fname} ${student.lname}`}
                              </TableCell>
                            <TableCell>{student.matric_no}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {student.department}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {student.course_of_study}
                            </TableCell>
                            <TableCell>{student.gender}</TableCell>
                            <TableCell>{student.cgpa}</TableCell>
                            <TableCell className="max-w-[120px] truncate">
                              {student.state_of_origin}
                            </TableCell>
                            <TableCell>{getStatusBadge(student)}</TableCell>
                            <TableCell>{getPaymentBadge(student)}</TableCell>
                            <TableCell>{formatDate(student.created_at)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewStudentDetails(student.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}

              {/* Bulk Actions Bar */}
              {selectedStudents.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudents([]);
                            setSelectAll(false);
                          }}
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkExport}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export Selected
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
                </CardContent>
              </Card>
            </div>
          </main>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Student Details - {selectedStudent?.fname} {selectedStudent?.lname}
            </DialogTitle>
            <DialogDescription>
              Complete information for this student&apos;s information update.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.fname}</div>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.lname}</div>
                  </div>
                  {selectedStudent.mname && (
                    <div>
                      <Label>Middle Name</Label>
                      <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.mname}</div>
                    </div>
                  )}
                  <div>
                    <Label>Gender</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.gender}</div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.email}</div>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.phone}</div>
                  </div>
                  <div>
                    <Label>State of Origin</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.state_of_origin}</div>
                  </div>
                  <div>
                    <Label>LGA</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.lga}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="academic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Matric Number</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.matric_no}</div>
                  </div>
                  <div>
                    <Label>Institution</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.institution}</div>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.department}</div>
                  </div>
                  <div>
                    <Label>Course of Study</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.course_of_study}</div>
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.graduation_year}</div>
                  </div>
                  <div>
                    <Label>CGPA</Label>
                    <div className="mt-1 p-2 bg-muted rounded">{selectedStudent.cgpa}</div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="contact" className="space-y-4">
                <div className="text-center text-muted-foreground">
                  Contact information details would be displayed here.
                </div>
              </TabsContent>
              <TabsContent value="payment" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Status</Label>
                    <div className="mt-1">{getPaymentBadge(selectedStudent)}</div>
                  </div>
                  {selectedStudent.is_paid && (
                    <>
                      <div>
                        <Label>Amount Paid</Label>
                        <div className="mt-1 p-2 bg-muted rounded">
                          {formatCurrency(selectedStudent.payment_amount || 0)}
                        </div>
                      </div>
                      <div>
                        <Label>Payment Date</Label>
                        <div className="mt-1 p-2 bg-muted rounded">
                          {selectedStudent.payment_date ? formatDate(selectedStudent.payment_date) : 'N/A'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
};

export default StudentsManagementPage;