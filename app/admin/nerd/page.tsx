'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { Search, Brain, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';
import { SUPER_ADMIN_STAFF_ID } from '@/utils/rolePermissions';
import { useRouter } from 'next/navigation';

interface NerdStudent {
  nin: string | null;
  matric_no: string | null;
  student_email: string | null;
  phone_number: string | null;
  first_name: string | null;
  middle_name: string | null;
  surname: string | null;
  sex: string | null;
  date_of_birth: string | null;
  state: string | null;
  programme_major: string | null;
  award_title: string | null;
  award_short_title: string | null;
  programme_award_combined: string | null;
  programme_category: string | null;
  programme_type: string | null;
  class_of_degree_text: string | null;
  final_cgpa: number | string | null;
  graduation_session: string | null;
  graduation_date: string | null;
  grade_approval_date: string | null;
  admission_date: string | null;
  mode_of_entry: string | null;
  faculty_name: string | null;
  department_name: string | null;
  senate_meeting_ref: string | null;
  graduate_list_ref: string | null;
  verified_by: string | null;
  remarks: string | null;
}

const FIELDS: { key: keyof NerdStudent; label: string; available: boolean }[] = [
  { key: 'nin', label: 'NIN', available: true },
  { key: 'matric_no', label: 'Matric No', available: true },
  { key: 'student_email', label: 'Student Email', available: true },
  { key: 'phone_number', label: 'Phone Number', available: true },
  { key: 'first_name', label: 'First Name', available: true },
  { key: 'middle_name', label: 'Middle Name', available: true },
  { key: 'surname', label: 'Surname', available: true },
  { key: 'sex', label: 'Sex', available: true },
  { key: 'date_of_birth', label: 'Date of Birth', available: true },
  { key: 'state', label: 'State', available: true },
  { key: 'programme_major', label: 'Programme Major', available: true },
  { key: 'award_title', label: 'Award Title', available: false },
  { key: 'award_short_title', label: 'Award Short Title', available: false },
  { key: 'programme_award_combined', label: 'Programme Award Combined', available: false },
  { key: 'programme_category', label: 'Programme Category', available: false },
  { key: 'programme_type', label: 'Programme Type', available: true },
  { key: 'class_of_degree_text', label: 'Class of Degree', available: true },
  { key: 'final_cgpa', label: 'Final CGPA', available: true },
  { key: 'graduation_session', label: 'Graduation Session', available: true },
  { key: 'graduation_date', label: 'Graduation Date', available: false },
  { key: 'grade_approval_date', label: 'Grade Approval Date', available: false },
  { key: 'admission_date', label: 'Admission Date', available: true },
  { key: 'mode_of_entry', label: 'Mode of Entry', available: true },
  { key: 'faculty_name', label: 'Faculty Name', available: true },
  { key: 'department_name', label: 'Department Name', available: true },
  { key: 'senate_meeting_ref', label: 'Senate Meeting Ref', available: false },
  { key: 'graduate_list_ref', label: 'Graduate List Ref', available: false },
  { key: 'verified_by', label: 'Verified By', available: false },
  { key: 'remarks', label: 'Remarks', available: false },
];

const KEY_FIELDS: (keyof NerdStudent)[] = [
  'first_name', 'surname', 'matric_no', 'nin', 'sex',
  'department_name', 'faculty_name', 'final_cgpa', 'programme_type',
];

const NerdPage: React.FC = () => {
  const { user, userType, isLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<NerdStudent[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const pageSize = 20;

  useEffect(() => {
    if (!isLoading && user && userType === 'admin' && (user as any).id !== SUPER_ADMIN_STAFF_ID) {
      router.replace('/staff');
    }
  }, [user, userType, isLoading]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const response = await adminService.getNerdStudents(search || undefined);
      setStudents(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch nerd data:', error);
      toast.error('Failed to load nerd data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && userType === 'admin') {
      fetchData();
    }
  }, [user, userType]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getFieldValue = (student: NerdStudent, key: keyof NerdStudent): string => {
    const val = student[key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  const exportCSV = () => {
    const headers = FIELDS.map(f => f.label);
    const rows = students.map(s =>
      FIELDS.map(f => `"${getFieldValue(s, f.key).replace(/"/g, '""')}"`)
    );
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nerd_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" text="Loading..." className="animate-scale-in" />
      </div>
    );
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 overflow-y-auto h-screen pt-28 md:pt-32 pb-24 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-full mx-auto space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="bg-background rounded-xl border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    Nerd — Student Graduate Records
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-base mt-2">
                    Complete student records. Fields marked "—" are not yet available.
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className="text-xs">
                    {students.length} records
                  </Badge>
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Field Legend */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Available ({FIELDS.filter(f => f.available).length})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Empty ({FIELDS.filter(f => !f.available).length})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search name, matric, NIN, dept..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <Button onClick={handleSearch} size="sm" className="sm:size-default">Search</Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading / Empty */}
            {isLoadingData ? (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <LoadingSpinner size="lg" text="Loading records..." />
                </CardContent>
              </Card>
            ) : students.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No student records found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table (md+) */}
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">#</th>
                            {FIELDS.map(f => (
                              <th
                                key={f.key}
                                className={`p-3 text-left font-semibold whitespace-nowrap ${f.available ? 'text-gray-900' : 'text-gray-400'}`}
                              >
                                <span className="flex items-center gap-1">
                                  {f.label}
                                  <span className={`w-1.5 h-1.5 rounded-full ${f.available ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStudents.map((student, idx) => (
                            <tr
                              key={idx}
                              className="border-b hover:bg-gray-50 cursor-pointer"
                              onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                            >
                              <td className="p-3 text-gray-500 sticky left-0 bg-white hover:bg-gray-50 z-10">
                                {(currentPage - 1) * pageSize + idx + 1}
                              </td>
                              {FIELDS.map(f => {
                                const val = getFieldValue(student, f.key);
                                const isEmpty = val === '—';
                                return (
                                  <td
                                    key={f.key}
                                    className={`p-3 max-w-[200px] truncate ${isEmpty ? 'text-gray-300 italic' : ''} ${f.available ? '' : 'bg-gray-50/50'}`}
                                    title={val}
                                  >
                                    {val}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Card View (sm/md) */}
                <div className="md:hidden space-y-3">
                  {paginatedStudents.map((student, idx) => {
                    const isExpanded = expandedRow === idx;
                    return (
                      <Card
                        key={idx}
                        className="overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {/* Compact card header */}
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : idx)}
                            className="w-full text-left p-4 flex items-start justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-400 font-mono">
                                  #{(currentPage - 1) * pageSize + idx + 1}
                                </span>
                                <p className="font-semibold text-gray-900 truncate">
                                  {getFieldValue(student, 'first_name')} {getFieldValue(student, 'surname')}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {getFieldValue(student, 'matric_no')}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {getFieldValue(student, 'department_name')}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  CGPA: {getFieldValue(student, 'final_cgpa')}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {getFieldValue(student, 'sex')}
                                </Badge>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
                            )}
                          </button>

                          {/* Expanded fields */}
                          {isExpanded && (
                            <div className="border-t bg-gray-50/50 p-4 space-y-2.5">
                              {FIELDS.map(f => {
                                const val = getFieldValue(student, f.key);
                                const isEmpty = val === '—';
                                return (
                                  <div key={f.key} className="flex items-start justify-between gap-3">
                                    <span className={`text-xs font-medium shrink-0 ${f.available ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {f.label}
                                    </span>
                                    <span className={`text-xs text-right ${isEmpty ? 'text-gray-300 italic' : 'text-gray-900'}`}>
                                      {val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, students.length)} of {students.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs sm:text-sm font-medium">{currentPage} / {totalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default NerdPage;
