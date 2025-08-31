'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  ArrowDownTrayIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';

interface ExportFilter {
  department?: string;
  gender?: string;
  state?: string;
  paymentStatus?: string;
  dataStatus?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  matricNumbers?: string[];
}

interface ExportJob {
  id: string;
  type: 'student_nysc' | 'payments' | 'submissions';
  format: 'csv' | 'excel' | 'pdf';
  filters: ExportFilter;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  recordCount?: number;
  fileSize?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

const DataExport: React.FC = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Export form state
  const [exportType, setExportType] = useState<'student_nysc' | 'payments' | 'submissions'>('student_nysc');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [filters, setFilters] = useState<ExportFilter>({
    department: '',
    gender: '',
    state: '',
    paymentStatus: '',
    dataStatus: '',
    dateRange: {
      start: '',
      end: ''
    },
    matricNumbers: []
  });
  const [matricNumbersText, setMatricNumbersText] = useState('');

  // TODO: Replace with API calls to fetch dynamic data
  const [departments, setDepartments] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  // Fetch departments and states from API
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // TODO: Implement actual API calls
        // const deptResponse = await adminService.getDepartments();
        // const stateResponse = await adminService.getStates();
        // setDepartments(deptResponse.departments || []);
        // setStates(stateResponse.states || []);
        
        // For now, show empty arrays until API is implemented
        setDepartments([]);
        setStates([]);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        toast.error('Failed to load dropdown options');
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!hasPermission('canDownloadData')) {
        toast.error('You do not have permission to access data export');
        router.push('/admin');
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    const fetchExportJobs = async () => {
      try {
        // Load export history from API
        const response = await adminService.getExportJobs();
        setExportJobs(response.jobs || []);
      } catch (error) {
        console.error('Error fetching export jobs:', error);
        toast.error('Failed to load export history');
      }
    };
    
    if (userType === 'admin' && hasPermission('canDownloadData')) {
      fetchExportJobs();
    }
  }, [userType, hasPermission]);

  const handleExport = async () => {
    if (!exportType) {
      toast.error('Please select an export type');
      return;
    }

    try {
      setIsExporting(true);
      
      // Process matric numbers
      const matricNumbers = matricNumbersText
        .split(/[,\n]/) // Split by comma or newline
        .map(num => num.trim())
        .filter(num => num.length > 0);
      
      const exportFilters = {
        ...filters,
        matricNumbers: matricNumbers.length > 0 ? matricNumbers : undefined
      };
      
      // Remove empty filters
      Object.keys(exportFilters).forEach((key) => {
        const k = key as keyof ExportFilter;
        const value = exportFilters[k] as unknown;
        const isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0) ||
          (k === 'dateRange' &&
            value &&
            typeof value === 'object' &&
            'start' in (value as any) &&
            'end' in (value as any) &&
            ((value as any).start === '' && (value as any).end === ''));
      
        if (isEmpty) {
          delete exportFilters[k];
        }
      });
      
      // Create export job via API
      const jobData = {
        type: exportType,
        format: exportFormat,
        filters: exportFilters
      };
      
      const response = await adminService.createExportJob(jobData);
      
      // Refresh export jobs list
      const updatedJobs = await adminService.getExportJobs();
      setExportJobs(updatedJobs.jobs || []);
      
      toast.success('Export job started successfully');
      setActiveTab('history');
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to start export job');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async (job: ExportJob) => {
    if (job.status === 'completed') {
      try {
        toast.success(`Downloading ${job.type} data...`);
        const blob = await adminService.downloadExportFile(job.id);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${job.type}_export_${job.id}.${job.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      }
    }
  };

  const getStatusBadge = (status: ExportJob['status']) => {
    const configs = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };

    const icons = {
      pending: ClockIcon,
      processing: ClockIcon,
      completed: CheckCircleIcon,
      failed: CheckCircleIcon
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${configs[status]}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: ExportJob['type']) => {
    const icons = {
      student_nysc: UserGroupIcon,
      payments: CreditCardIcon,
      submissions: DocumentTextIcon
    };
    return icons[type];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterSummary = (filters: ExportFilter) => {
    const parts = [];
    if (filters.department) parts.push(`Dept: ${filters.department}`);
    if (filters.gender) parts.push(`Gender: ${filters.gender}`);
    if (filters.state) parts.push(`State: ${filters.state}`);
    if (filters.paymentStatus) parts.push(`Payment: ${filters.paymentStatus}`);
    if (filters.dataStatus) parts.push(`Data: ${filters.dataStatus}`);
    if (filters.dateRange?.start && filters.dateRange?.end) {
      parts.push(`Date: ${filters.dateRange.start} to ${filters.dateRange.end}`);
    }
    if (filters.matricNumbers && filters.matricNumbers.length > 0) {
      parts.push(`${filters.matricNumbers.length} matric numbers`);
    }
    return parts.length > 0 ? parts.join(', ') : 'No filters applied';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userType !== 'admin' || !hasPermission('canDownloadData')) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Data Export
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Export student NYSC data, payments, and submissions
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('export')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'export'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 inline mr-2" />
                  New Export
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <ClockIcon className="h-4 w-4 inline mr-2" />
                  Export History
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'export' ? (
            /* Export Form */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Export Settings */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Export Settings
                    </h3>
                    
                    {/* Export Type */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Type
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: 'student_nysc', label: 'Student NYSC Records', icon: UserGroupIcon },
                          { value: 'payments', label: 'Payment Records', icon: CreditCardIcon },
                          { value: 'submissions', label: 'Temp Submissions', icon: DocumentTextIcon }
                        ].map(({ value, label, icon: Icon }) => (
                          <label key={value} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="exportType"
                              value={value}
                              checked={exportType === value}
                              onChange={(e) => setExportType(e.target.value as any)}
                              className="mr-3"
                            />
                            <Icon className="h-5 w-5 mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Export Format */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'excel', label: 'Excel', icon: TableCellsIcon },
                          { value: 'csv', label: 'CSV', icon: DocumentTextIcon },
                          { value: 'pdf', label: 'PDF', icon: DocumentArrowDownIcon }
                        ].map(({ value, label, icon: Icon }) => (
                          <label key={value} className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="exportFormat"
                              value={value}
                              checked={exportFormat === value}
                              onChange={(e) => setExportFormat(e.target.value as any)}
                              className="mb-2"
                            />
                            <Icon className="h-5 w-5 mb-1 text-gray-400" />
                            <span className="text-xs font-medium text-gray-900 dark:text-white">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Filters */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      <FunnelIcon className="h-5 w-5 inline mr-2" />
                      Filters (Optional)
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Department Filter */}
                      {exportType === 'student_nysc' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Department
                          </label>
                          <select
                            value={filters.department || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* Gender Filter */}
                      {exportType === 'student_nysc' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Gender
                          </label>
                          <select
                            value={filters.gender || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      )}
                      
                      {/* State Filter */}
                      {exportType === 'student_nysc' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State
                          </label>
                          <select
                            value={filters.state || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All States</option>
                            {states.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* Payment Status Filter */}
                      {exportType === 'payments' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Status
                          </label>
                          <select
                            value={filters.paymentStatus || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      )}
                      
                      {/* Data Status Filter */}
                      {exportType === 'submissions' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Data Status
                          </label>
                          <select
                            value={filters.dataStatus || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, dataStatus: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      )}
                      
                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={filters.dateRange?.start || ''}
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              dateRange: { ...prev.dateRange, start: e.target.value, end: prev.dateRange?.end || '' }
                            }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Start Date"
                          />
                          <input
                            type="date"
                            value={filters.dateRange?.end || ''}
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              dateRange: { start: prev.dateRange?.start || '', end: e.target.value }
                            }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                      
                      {/* Matric Numbers Filter */}
                      {exportType === 'student_nysc' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Specific Matric Numbers
                          </label>
                          <textarea
                            value={matricNumbersText}
                            onChange={(e) => setMatricNumbersText(e.target.value)}
                            placeholder="Enter matric numbers separated by commas or new lines...\ne.g. 2019/CS/001, 2019/CS/002"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Export Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                    >
                      {isExporting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Starting Export...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                          Start Export
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Export History */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Export History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and download your previous exports
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Export Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Filters
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {exportJobs.map((job, index) => {
                      const TypeIcon = getTypeIcon(job.type);
                      return (
                        <tr 
                          key={job.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <TypeIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Export
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {job.format.toUpperCase()} • {formatDate(job.createdAt)}
                                </div>
                                {job.recordCount && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500">
                                    {job.recordCount.toLocaleString()} records • {job.fileSize}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={getFilterSummary(job.filters)}>
                              {getFilterSummary(job.filters)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(job.status)}
                            {job.error && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {job.error}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {job.status === 'processing' ? (
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${job.progress}%` }}
                                ></div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {job.status === 'completed' ? '100%' : job.status === 'failed' ? '0%' : 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {job.status === 'completed' && (
                              <button
                                onClick={() => handleDownload(job)}
                                className="inline-flex items-center px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg text-sm transition-colors"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default DataExport;