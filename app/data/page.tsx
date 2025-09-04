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
      console.log('Starting download for format:', fmt);
      console.log('User authenticated:', isAuthenticated);
      console.log('User type:', userType);
      console.log('Is admin:', isAdmin);
      
      const resp = await axios.get(`/api/nysc/export/${fmt}`, { responseType: 'blob' });
      console.log('Download response:', resp);
      
      const filename = `nysc_data_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.${fmt}`;
      saveAs(resp.data, filename);
      console.log('File saved successfully:', filename);
    } catch (e: any) {
      console.error('Download error:', e);
      console.error('Error response:', e.response);
      alert(`Download failed: ${e.response?.data?.message || e.message}`);
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

            {/* Mobile Table View - Hidden on desktop */}
            <div className="block lg:hidden">
              {sorted.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <MagnifyingGlassIcon className="w-10 h-10 text-gray-300 mb-3 mx-auto" />
                  <p className="text-base font-medium text-gray-900">No students found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50">
                          <tr>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matric No</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surname</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Year</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marital Status</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JAMB No</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Military</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Mode</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sorted.map((s, index) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-1 py-2 text-xs font-medium text-gray-900">{s.matric_no}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.fname}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.mname || '-'}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.lname}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.phone}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.state}</td>
                              <td className="px-1 py-2 text-xs">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {isAdmin ? s.cgpa : '****'}
                                </span>
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-700">{isAdmin ? formatDate(s.dob) : '**/**/****'}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.graduation_year}</td>
                              <td className="px-1 py-2 text-xs">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  s.is_status 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {s.is_status ? 'Revalidation' : 'Fresh'}
                                </span>
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.gender}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.marital_status}</td>
                              <td className="px-1 py-2 text-xs text-gray-700">{s.jamb_no}</td>
                              <td className="px-1 py-2 text-xs">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  s.is_military 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {s.is_military ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-1 py-2 text-xs text-gray-700 max-w-xs truncate" title={s.course_study}>{s.course_study}</td>
                              <td className="px-1 py-2 text-xs">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
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
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
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
                              {isAdmin ? s.cgpa : '****'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {isAdmin ? formatDate(s.dob) : '**/**/****'}
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

      {/* WhatsApp Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/2348168438930?text=Hello,%20I%20need%20help%20with%20my%20NYSC%20data"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
          title="Chat with us on WhatsApp"
        >
          <svg
            className="w-7 h-7 group-hover:scale-110 transition-transform duration-200"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        </a>
      </div>
    </div>
  );
}