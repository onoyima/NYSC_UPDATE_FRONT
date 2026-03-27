'use client';

import React, { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { 
  ExclamationTriangleIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';

interface TempSubmission {
  id: number;
  student_id: number;
  fname: string;
  lname: string;
  mname: string;
  matric_no: string;
  email: string;
  phone: string;
  department: string;
  faculty: string;
  gender: string;
  dob: string;
  marital_status: string;
  state: string;
  lga: string;
  cgpa: string;
  graduation_year: string;
  jamb_no: string;
  course_study: string;
  submission_type: string;
  submission_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  created_at: string;
  updated_at: string;
}

// Format ISO date to DD/MM/YYYY
const formatDate = (iso: string): string => {
  if (!iso || iso === 'N/A') return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function SubmissionsPage() {
  const { isAuthenticated, userType } = useAuth();
  const [data, setData] = useState<TempSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TempSubmission; direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const isAdmin = isAuthenticated && userType === 'admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/nysc/admin/submissions?limit=1000');
      setData(res.data.submissions || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await axios.delete(`/api/nysc/admin/submissions/${id}`);
      toast.success('Submission deleted successfully');
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete submission');
    }
  };

  const filtered = data.filter(item => {
    const matchesSearch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );
    const matchesStatus = !filterStatus || item.submission_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sorted = sortConfig
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filtered;

  const requestSort = (key: keyof TempSubmission) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-600 font-inter">Unauthorized Access</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Modern Header with Logo */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg sm:text-xl">
                  S
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-outfit">NYSC Submissions Portal</h1>
                  <p className="text-xs sm:text-sm text-gray-600">Temporary Table (nysc_temp_submissions)</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Admin
              </Link>
              <Link
                href="/admin/data"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                Verified Data
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           {[
             { label: 'Pending', count: data.filter(d => d.submission_status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: ClockIcon },
             { label: 'Approved', count: data.filter(d => d.submission_status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircleIcon },
             { label: 'Under Review', count: data.filter(d => d.submission_status === 'under_review').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: EyeIcon },
             { label: 'Rejected', count: data.filter(d => d.submission_status === 'rejected').length, color: 'text-red-600', bg: 'bg-red-50', icon: XCircleIcon },
           ].map((stat, i) => (
             <div key={i} className={`${stat.bg} ${stat.color} p-4 rounded-xl shadow-sm border border-current/10 flex items-center space-x-3`}>
               <stat.icon className="w-6 h-6 flex-shrink-0" />
               <div>
                  <p className="text-xs font-semibold uppercase">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.count}</p>
               </div>
             </div>
           ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by any field..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="under_review">Under Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View with Exact Column Names */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: 'fname', key: 'fname' },
                    { label: 'lname', key: 'lname' },
                    { label: 'mname', key: 'mname' },
                    { label: 'matric_no', key: 'matric_no' },
                    { label: 'status', key: 'submission_status' },
                    { label: 'department', key: 'department' },
                    { label: 'phone', key: 'phone' },
                    { label: 'email', key: 'email' },
                    { label: 'cgpa', key: 'cgpa' },
                    { label: 'gender', key: 'gender' },
                    { label: 'state', key: 'state' },
                    { label: 'graduation_year', key: 'graduation_year' },
                    { label: 'updated_at', key: 'updated_at' },
                    { label: 'actions', key: 'id' }
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => requestSort(col.key as keyof TempSubmission)}
                      className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{col.label}</span>
                        {sortConfig?.key === col.key && (
                          <span className="text-teal-600">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                       <p className="text-lg font-medium">No records matching your search</p>
                    </td>
                  </tr>
                ) : (
                  sorted.map((s, index) => (
                    <tr key={s.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{s.fname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.lname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.mname || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{s.matric_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${getStatusStyle(s.submission_status)}`}>
                          {s.submission_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-[150px] truncate">{s.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">{s.cgpa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.gender}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.state}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.graduation_year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(s.updated_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center space-x-3">
                         <Link href={`/admin/submissions/${s.id}`} className="text-indigo-600 hover:text-indigo-900" title="View Detail">
                           <EyeIcon className="w-5 h-5" />
                         </Link>
                         <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700" title="Delete record">
                           <TrashIcon className="w-5 h-5" />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
