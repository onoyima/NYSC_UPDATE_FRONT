'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';
import adminService from '@/services/admin.service';

interface TempSubmission {
  id: number;
  student_id: number;
  student_name: string;
  matric_number: string;
  email: string;
  department: string;
  faculty: string;
  level: string;
  submission_type: 'initial' | 'update' | 'correction';
  submission_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submitted_data: {
    personal_info?: any;
    academic_info?: any;
    contact_info?: any;
    documents?: any;
  };
  submission_date: string;
  reviewed_date?: string;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

const SubmissionsManagement: React.FC = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<TempSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!hasPermission('canViewTempSubmissions')) {
        toast.error('You do not have permission to access this page');
        router.push('/admin');
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoadingData(true);
        // Fetch real submission data from the backend API
        const response = await adminService.getSubmissions(currentPage, itemsPerPage);
        setSubmissions(response.submissions || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submission data');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (userType === 'admin' && hasPermission('canViewTempSubmissions')) {
      fetchSubmissions();
    }
  }, [userType, hasPermission, currentPage, itemsPerPage]);

  // Filter and search logic
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch =
      submission.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.matric_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || submission.submission_status === filterStatus;
    const matchesType = !filterType || submission.submission_type === filterType;
    const matchesDepartment = !filterDepartment || submission.department === filterDepartment;

    return matchesSearch && matchesStatus && matchesType && matchesDepartment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // Get unique departments for filter
  const departments = Array.from(new Set(submissions.map(s => s.department)));

  // Calculate summary statistics
  const pendingSubmissions = submissions.filter(s => s.submission_status === 'pending').length;
  const approvedSubmissions = submissions.filter(s => s.submission_status === 'approved').length;
  const rejectedSubmissions = submissions.filter(s => s.submission_status === 'rejected').length;
  const underReviewSubmissions = submissions.filter(s => s.submission_status === 'under_review').length;

  const getStatusBadge = (status: TempSubmission['submission_status']) => {
    const configs = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${configs[status]}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: TempSubmission['submission_type']) => {
    const configs = {
      initial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      update: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      correction: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${configs[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectSubmission = (submissionId: number) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === paginatedSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(paginatedSubmissions.map(s => s.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Please select submissions to approve');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to approve ${selectedSubmissions.length} submission(s)?`);
    if (!confirmed) return;

    try {
      // TODO: Implement actual bulk approve API call
      // await adminService.bulkApproveSubmissions(selectedSubmissions);
      toast.error('Bulk approve functionality not implemented yet');
      setSelectedSubmissions([]);
      // TODO: Refresh data after successful approval
    } catch (error) {
      console.error('Error approving submissions:', error);
      toast.error('Failed to approve submissions');
    }
  };

  const handleBulkReject = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Please select submissions to reject');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to reject ${selectedSubmissions.length} submission(s)?`);
    if (!confirmed) return;

    try {
      // TODO: Implement actual bulk reject API call
      // await adminService.bulkRejectSubmissions(selectedSubmissions);
      toast.error('Bulk reject functionality not implemented yet');
      setSelectedSubmissions([]);
      // TODO: Refresh data after successful rejection
    } catch (error) {
      console.error('Error rejecting submissions:', error);
      toast.error('Failed to reject submissions');
    }
  };

  const handleBulkExport = () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Please select submissions to export');
      return;
    }
    // Implement bulk export logic
    toast.success(`Exporting ${selectedSubmissions.length} submission records...`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userType !== 'admin') {
    return null;
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        {/* Fixed Sidebar */}
        <Sidebar />

        {/* Navbar */}
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Temporary Submissions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Review and manage student data submissions
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingSubmissions}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {approvedSubmissions}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Under Review</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {underReviewSubmissions}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {rejectedSubmissions}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="initial">Initial</option>
                  <option value="update">Update</option>
                  <option value="correction">Correction</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Export Button */}
              <div>
                <button
                  onClick={handleBulkExport}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedSubmissions.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedSubmissions.length} submission(s) selected
                </span>
                <div className="flex space-x-2">
                  {hasPermission('canEditTempSubmissions') && (
                    <button
                      onClick={handleBulkApprove}
                      className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                  )}
                  {hasPermission('canEditTempSubmissions') && (
                    <button
                      onClick={handleBulkReject}
                      className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  )}
                  <button
                    onClick={handleBulkExport}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Export Selected
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.length === paginatedSubmissions.length && paginatedSubmissions.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Submission Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reviewed By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedSubmissions.map((submission, index) => (
                        <tr
                          key={submission.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedSubmissions.includes(submission.id)}
                              onChange={() => handleSelectSubmission(submission.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {submission.student_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {submission.matric_number}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {submission.department}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getTypeBadge(submission.submission_type)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(submission.submission_status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(submission.submission_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {submission.reviewed_by || 'N/A'}
                            </div>
                            {submission.reviewed_date && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(submission.reviewed_date)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/admin/submissions/${submission.id}`}
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                              {hasPermission('canEditTempSubmissions') && (
                                <Link
                                  href={`/admin/submissions/${submission.id}/edit`}
                                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                  title="Edit Submission"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Previous
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 border rounded text-sm ${
                              currentPage === i + 1
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default SubmissionsManagement;
