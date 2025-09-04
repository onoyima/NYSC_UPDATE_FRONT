'use client';

import React, { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { saveAs } from 'file-saver';
import { ExclamationTriangleIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

interface StudentData {
  id: number;
  matric_no: string;
  fname: string;
  mname: string;
  lname: string;
  phone: string;
  state: string;
  cgpa: string;
  dob: string;
  graduation_year: number;
  is_status?: boolean;
  gender: string;
  marital_status: string;
  jamb_no: string;
  is_military?: boolean;
  course_study: string;
  study_mode: 'Full-Time' | 'Part-Time' | 'Sandwich';
}

// Format ISO date to DD/MM/YYYY
const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function AdminDataPage() {
  const { isAuthenticated, userType } = useAuth();
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentData; direction: 'asc' | 'desc' } | null>(null);
  
  // Check if user is admin for download permissions
  const isAdmin = isAuthenticated && userType === 'admin';

  useEffect(() => {
    axios.get('/api/nysc')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

 const sorted = sortConfig
  ? [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    })
  : filtered;

  const requestSort = (key: keyof StudentData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleDownload = async (fmt: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const resp = await axios.get(`/api/nysc/export/${fmt}`, { responseType: 'blob' });
      const filename = `nysc_data_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.${fmt}`;
      saveAs(resp.data, filename);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Modern Header with Logo */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
              {/* Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">N</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Data Portal</h1>
                  <p className="text-xs sm:text-sm text-gray-600">Student Information Management</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Download Buttons - Only for Admin Users */}
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-3">
                <button 
                  onClick={() => handleDownload('csv')} 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  CSV
                </button>
                <button 
                  onClick={() => handleDownload('xlsx')} 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Excel
                </button>
                <button 
                  onClick={() => handleDownload('pdf')} 
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  PDF
                </button>
              </div>
            )}
            
            {/* Mobile Download Buttons - Only for Admin Users */}
            {isAdmin && (
              <div className="md:hidden grid grid-cols-3 gap-2 w-full">
                <button 
                  onClick={() => handleDownload('csv')} 
                  className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                >
                  <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                  CSV
                </button>
                <button 
                  onClick={() => handleDownload('xlsx')} 
                  className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md"
                >
                  <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                  Excel
                </button>
                <button 
                  onClick={() => handleDownload('pdf')} 
                  className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
                >
                  <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Warning Card - Full width on mobile, sidebar on desktop */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">Important Notice</h3>
                <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                  Ensure the information you see here is accurate as it will be used to upload your details to the senate list when due. Any errors? Visit the{' '}
                  <a 
                    href="https://studentupdate.vercel.app/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors duration-200"
                  >
                    Student Update System
                  </a>
                  {' '}to update your details to match your NIN, JAMB, and school portal records.
                </p>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Only the details shown on this page will be used.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
            {/* Search Input */}
            <div className="mb-6 lg:mb-8">
              <div className="relative max-w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border  rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                />
              </div>
              {search && (
                <p className="mt-2 text-sm text-gray-600">
                  Showing {sorted.length} of {data.length} students
                </p>
              )}
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="block lg:hidden space-y-4">
              {sorted.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                  <p className="text-lg font-medium text-gray-900">No students found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                sorted.map((s, index) => (
                  <div key={s.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{s.fname} {s.lname}</h3>
                        <p className="text-sm text-gray-600">{s.matric_no}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.is_status 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.is_status ? 'Revalidation' : 'Fresh'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Phone:</span>
                        <p className="text-gray-900">{s.phone}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">State:</span>
                        <p className="text-gray-900">{s.state}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">CGPA:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {s.cgpa} 
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Gender:</span>
                        <p className="text-gray-900">{s.gender}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">DOB:</span>
                        <p className="text-gray-900">{formatDate(s.dob)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Graduation:</span>
                        <p className="text-gray-900">{s.graduation_year}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Study Mode:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.study_mode === 'Full-Time' 
                            ? 'bg-green-100 text-green-800'
                            : s.study_mode === 'Part-Time'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {s.study_mode}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Military:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.is_military 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {s.is_military ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {s.course_study && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="font-medium text-gray-500">Course:</span>
                        <p className="text-sm text-gray-900 mt-1">{s.course_study}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      {[
                        { label: 'Matric No', key: 'matric_no' },
                        { label: 'First Name', key: 'fname' },
                        { label: 'Middle Name', key: 'mname' },
                        { label: 'Surname', key: 'lname' },
                        { label: 'Phone', key: 'phone' },
                        { label: 'State', key: 'state' },
                        { label: 'CGPA', key: 'cgpa' },
                        { label: 'DOB', key: 'dob' },
                        { label: 'Graduation Year', key: 'graduation_year' },
                        { label: 'Status', key: 'is_status' },
                        { label: 'Gender', key: 'gender' },
                        { label: 'Marital Status', key: 'marital_status' },
                        { label: 'JAMB No', key: 'jamb_no' },
                        { label: 'Military', key: 'is_military' },
                        { label: 'Course', key: 'course_study' },
                        { label: 'Study Mode', key: 'study_mode' }
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => requestSort(col.key as keyof StudentData)}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200 select-none"
                        >
                          <div className="flex items-center space-x-1">
                            <span>{col.label}</span>
                            {sortConfig?.key === col.key && (
                              <span className="text-indigo-600">
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
                        <td colSpan={16} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">No students found</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sorted.map((s, index) => (
                        <tr 
                          key={s.id} 
                          className={`hover:bg-indigo-50 transition-colors duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {s.matric_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.fname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.mname || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.lname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {s.cgpa}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(s.dob)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.graduation_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              s.is_status 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {s.is_status ? 'Revalidation' : 'Fresh'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.gender}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.marital_status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {s.jamb_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              s.is_military 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {s.is_military ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={s.course_study}>
                            {s.course_study}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              s.study_mode === 'Full-Time' 
                                ? 'bg-green-100 text-green-800'
                                : s.study_mode === 'Part-Time'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {s.study_mode}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer with Stats */}
              {sorted.length > 0 && (
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 space-y-2 sm:space-y-0">
                    <div>
                      Showing <span className="font-medium text-gray-900">{sorted.length}</span> of{' '}
                      <span className="font-medium text-gray-900">{data.length}</span> students
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                        <span>Fresh: {sorted.filter(s => !s.is_status).length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                        <span>Revalidation: {sorted.filter(s => s.is_status).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}