'use client';

import React, { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { 
  MagnifyingGlassIcon, 
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';

// Helper to construct full URL from relative backend storage path
const getDocUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://localhost/') || url.startsWith('https://localhost/')) {
    // If backend asset() returned a bad localhost url (missing port), fix it
    const path = new URL(url).pathname;
    const base = axios.defaults.baseURL?.replace(/\/$/, '') || '';
    return `${base}${path}`;
  }
  if (url.startsWith('http')) return url;
  
  const base = axios.defaults.baseURL?.replace(/\/$/, '') || '';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface StudentData {
  id: number;
  student_id: number;
  matric_no: string;
  fname: string;
  mname: string;
  lname: string;
  phone: string;
  state: string;
  lga: string;
  cgpa: string;
  dob: string;
  graduation_year: string;
  gender: string;
  marital_status: string;
  jamb_no: string;
  course_study: string;
  faculty: string;
  department: string;
  study_mode: string;
  is_paid: boolean;
  is_military: boolean;
  is_status: boolean;
  class_of_degree: string;
  email: string;
  updated_at: string;
  created_at?: string;
}

const emptyForm = {
  fname: '', lname: '', mname: '', matric_no: '', department: '',
  gender: 'male', phone: '', state: '', graduation_year: '', cgpa: '',
  jamb_no: '', course_study: '', study_mode: '', dob: '', email: '',
  student_id: '', is_military: false, is_status: true, class_of_degree: ''
};

const formatDate = (iso: string): string => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB');
};

const formatTitleCase = (str: string | null | undefined): string => {
  if (!str) return '';
  return String(str).toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

export default function ManageDataPage() {
  const { isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<StudentData>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<typeof emptyForm>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);

  // Document Viewer State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [studentDocs, setStudentDocs] = useState<{name: string, url: string, source: string}[]>([]);
  const [selectedDocStudent, setSelectedDocStudent] = useState<{name: string, matric_no: string} | null>(null);

  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterPeriod, setFilterPeriod] = useState('all');
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 25
  });

  const isAdmin = isAuthenticated && userType === 'admin';

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/api/nysc/admin/students-data?page=${page}&per_page=${pagination.per_page}&sort_by=${sortBy}&sort_order=${sortOrder}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterPeriod === 'weekly') {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];
        url += `&date_from=${monday}`;
      } else if (filterPeriod === 'monthly') {
        const dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        url += `&date_from=${dateFrom}`;
      } else if (filterPeriod === 'year') {
        const dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        url += `&date_from=${dateFrom}`;
      }
      const res = await axios.get(url);
      const responseData = res.data.data;
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        setData(responseData.data || []);
        setPagination(prev => ({
          ...prev,
          current_page: responseData.current_page || 1,
          last_page: responseData.last_page || 1,
          total: responseData.total || 0
        }));
      } else {
        setData(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) fetchData(1);
  }, [authLoading, isAdmin, sortBy, sortOrder, filterPeriod]);

  const handleSearch = () => fetchData(1);

  const handleSortByColumn = (column: string) => {
    if (sortBy === column) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('desc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowsUpDownIcon className="w-3.5 h-3.5 opacity-30" />;
    return sortOrder === 'asc' ? <ArrowUpIcon className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDownIcon className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this record?')) return;
    try {
      await axios.delete(`/api/nysc/admin/student/${id}`);
      toast.success('Record deleted successfully');
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete record');
    }
  };

  const startEdit = (student: StudentData) => {
    setEditingId(student.id);
    setEditForm(student);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const payload = {
        id: editForm.id, fname: editForm.fname, mname: editForm.mname,
        lname: editForm.lname, matric_no: editForm.matric_no,
        department: editForm.department, gender: editForm.gender?.toLowerCase(),
        phone: editForm.phone, state: editForm.state, graduation_year: editForm.graduation_year,
        dob: editForm.dob, marital_status: editForm.marital_status?.toLowerCase(), jamb_no: editForm.jamb_no,
        course_study: editForm.course_study, study_mode: editForm.study_mode,
        is_military: editForm.is_military, is_status: editForm.is_status,
        student_id: editForm.student_id, class_of_degree: editForm.class_of_degree
      };
      await axios.put(`/api/nysc/admin/student/${editForm.student_id || editForm.id}`, payload);
      toast.success('Record updated successfully');
      setData(prev => prev.map(item => item.id === editingId ? { ...item, ...editForm } as StudentData : item));
      setEditingId(null);
    } catch (error: any) {
      console.error('Update failed:', error);
      const errors = error.response?.data?.errors;
      if (errors) {
        toast.error(Object.values(errors).flat()[0] as string || 'Update failed');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update record');
      }
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fname || !addForm.lname || !addForm.matric_no) {
      toast.error('First Name, Last Name, and Matric No are required');
      return;
    }
    
    if (!addForm.matric_no.toUpperCase().startsWith('VUG/')) {
      toast.error('Matric Number must start with VUG/');
      return;
    }

    setAddLoading(true);
    try {
      await axios.post('/api/nysc/admin/student', addForm);
      toast.success('Student record created successfully');
      setShowAddModal(false);
      setAddForm(emptyForm);
      fetchData(1);
    } catch (error: any) {
      console.error('Create failed:', error);
      const errors = error.response?.data?.errors;
      if (errors) {
        toast.error(Object.values(errors).flat()[0] as string || 'Validation failed');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create record');
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleViewDocuments = async (student: StudentData) => {
    setSelectedDocStudent({ name: `${student.fname} ${student.lname}`, matric_no: student.matric_no });
    setStudentDocs([]);
    setDocsLoading(true);
    setShowDocModal(true);

    try {
      const res = await axios.get(`/api/nysc/admin/students/search-documents?matric_no=${encodeURIComponent(student.matric_no)}`);
      if (res.data.success) {
        setStudentDocs(res.data.documents || []);
        if (!res.data.documents || res.data.documents.length === 0) {
          toast.info('No documents found for this student');
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get('/api/nysc/admin/student/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Template download failed:', error);
      toast.error('Failed to download template');
    }
  };

  const handleExport = async (range: string) => {
    try {
      const exportToast = toast.loading('Preparing Excel export...');
      const response = await axios.get('/api/nysc/admin/students-export', {
        params: { range, search, sort_by: sortBy, sort_order: sortOrder },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nysc_students_${range}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss(exportToast);
      toast.success('Export successful!');
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please check your connection.');
    }
  };

  const [uploading, setUploading] = useState(false);
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await axios.post('/api/nysc/admin/student/bulk-upload', formData);
      toast.success(res.data.message || 'Bulk upload completed');
      fetchData(1);
    } catch (error: any) {
      console.error('Bulk upload failed:', error);
      const errors = error.response?.data?.errors;
      if (errors) {
        toast.error(Object.values(errors).flat()[0] as string || 'Upload failed');
      } else {
        toast.error(error.response?.data?.message || 'Bulk upload failed');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return <div className="p-8 text-center text-slate-600 font-semibold">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 md:h-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">M</div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Data Management Studio</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadTemplate}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-sm font-semibold border border-slate-200"
            >
              Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all text-sm font-semibold border border-emerald-200 cursor-pointer">
              {uploading ? 'Uploading...' : 'Bulk Upload'}
              <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={uploading} />
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-semibold shadow-md shadow-indigo-200"
            >
              <PlusIcon className="w-4 h-4" />
              Add Student
            </button>
            <Link href="/admin/data" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">View Mode</Link>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
            <div className="relative w-full lg:w-96">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Global search... (Press Enter)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner text-slate-800"
              />
              {search && (
                <button onClick={() => { setSearch(''); setTimeout(() => fetchData(1), 0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Period</span>
                <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="bg-white border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 shadow-sm font-bold min-w-[120px]">
                  <option value="all">All Time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort By</span>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setSortOrder('desc'); }} className="bg-white border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 shadow-sm font-bold min-w-[150px]">
                  <option value="updated_at">Recently Updated</option>
                  <option value="created_at">Recently Registered</option>
                  <option value="fname">First Name</option>
                  <option value="lname">Surname</option>
                </select>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden xl:block" />

              <button 
                onClick={() => handleExport(filterPeriod)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-emerald-200 grow sm:grow-0 justify-center"
                title="Export current filtered data to Excel"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading student records...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="text-slate-400 text-base font-medium">No records found</p>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                  <PlusIcon className="w-4 h-4" /> Add First Student
                </button>
              </div>
            ) : (
              <table className="w-full min-w-[1200px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Actions</th>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Matric No</th>
                    <th className="px-6 py-4">First Name</th>
                    <th className="px-6 py-4">Middle Name</th>
                    <th className="px-6 py-4">Surname</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">DOB</th>
                    <th className="px-6 py-4">Marital Status</th>
                    <th className="px-6 py-4">Dept/Course</th>
                    <th className="px-6 py-4">Study Mode</th>
                    <th className="px-6 py-4">CGPA</th>
                    <th className="px-6 py-4">Class of Degree</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Military</th>
                    <th onClick={() => handleSortByColumn('updated_at')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                      <div className="flex items-center gap-1.5"><span>Updated At</span><SortIcon col="updated_at" /></div>
                    </th>
                    <th className="px-6 py-4">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    let lastMonth = '';
                    return data.map(s => {
                      const dateToUse = sortBy === 'created_at' ? s.created_at : s.updated_at;
                      const currentMonth = dateToUse ? new Date(dateToUse).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Unknown Period';
                      const showHeader = (sortBy === 'updated_at' || sortBy === 'created_at') && currentMonth !== lastMonth;
                      lastMonth = currentMonth;

                      return (
                        <React.Fragment key={s.id}>
                          {showHeader && (
                            <tr className="bg-slate-50/80 border-y border-slate-200/60">
                              <td colSpan={100} className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4 text-indigo-500" />
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{currentMonth}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className={`group hover:bg-slate-50 transition-colors ${editingId === s.id ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === s.id ? (
                          <div className="flex items-center space-x-2">
                            <button onClick={handleUpdate} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><CheckIcon className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500"><XMarkIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleViewDocuments(s)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="View Documents"><DocumentTextIcon className="w-4 h-4" /></button>
                            <button onClick={() => startEdit(s)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(s.id)} className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {editingId === s.id ? <input className="w-20 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.student_id} onChange={e => setEditForm({...editForm, student_id: Number(e.target.value)})} /> : s.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 font-medium">
                        {editingId === s.id ? <input className="w-32 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.matric_no} onChange={e => setEditForm({...editForm, matric_no: e.target.value})} /> : s.matric_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                        {editingId === s.id ? <input className="w-32 border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.fname} onChange={e => setEditForm({...editForm, fname: e.target.value})} placeholder="First" /> : formatTitleCase(s.fname)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {editingId === s.id ? <input className="w-32 border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.mname} onChange={e => setEditForm({...editForm, mname: e.target.value})} placeholder="Middle" /> : formatTitleCase(s.mname)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                        {editingId === s.id ? <input className="w-32 border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.lname} onChange={e => setEditForm({...editForm, lname: e.target.value})} placeholder="Last" /> : formatTitleCase(s.lname)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {editingId === s.id ? <input className="w-32 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /> : s.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {editingId === s.id ? <input type="date" className="w-32 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.dob ? editForm.dob.split('T')[0] : ''} onChange={e => setEditForm({...editForm, dob: e.target.value})} /> : formatDate(s.dob)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {editingId === s.id ? (
                          <select className="w-32 border border-slate-300 rounded-lg px-2 py-1 outline-none" value={editForm.marital_status} onChange={e => setEditForm({...editForm, marital_status: e.target.value})}>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="divorced">Divorced</option>
                            <option value="widowed">Widowed</option>
                          </select>
                        ) : formatTitleCase(s.marital_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === s.id ? (
                           <div className="flex flex-col gap-1">
                            <input className="w-40 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="Dept" />
                            <input className="w-40 border border-slate-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.course_study} onChange={e => setEditForm({...editForm, course_study: e.target.value})} placeholder="Course" />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-800">{formatTitleCase(s.department)}</div>
                            <div className="text-xs text-slate-400">{formatTitleCase(s.course_study)}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                        {editingId === s.id ? (
                          <select className="w-32 border border-slate-300 rounded-lg px-2 py-1 outline-none" value={editForm.study_mode} onChange={e => setEditForm({...editForm, study_mode: e.target.value})}>
                            <option value="">Select...</option>
                            <option value="Full-Time">Full-Time</option>
                            <option value="Part-Time">Part-Time</option>
                            <option value="Sandwich">Sandwich</option>
                            <option value="Distance Learning">Distance Learning</option>
                          </select>
                        ) : s.study_mode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === s.id ? <input className="w-16 border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.cgpa} onChange={e => setEditForm({...editForm, cgpa: e.target.value})} /> : <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-sm font-bold">{s.cgpa}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                        {editingId === s.id ? (
                          <select className="w-40 border border-slate-300 rounded-lg px-2 py-1 outline-none" value={editForm.class_of_degree} onChange={e => setEditForm({...editForm, class_of_degree: e.target.value})}>
                            <option value="">Select Class</option>
                            <option value="First Class">First Class</option>
                            <option value="Second Class Upper">Second Class Upper</option>
                            <option value="Second Class Lower">Second Class Lower</option>
                            <option value="Third Class">Third Class</option>
                            <option value="Pass">Pass</option>
                            <option value="Unclassified">Unclassified</option>
                          </select>
                        ) : s.class_of_degree || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === s.id ? (
                          <select className="w-24 border border-slate-300 rounded-lg px-2 py-1 outline-none" value={String(editForm.is_status)} onChange={e => setEditForm({...editForm, is_status: e.target.value === 'true'})}>
                            <option value="true">Fresh</option>
                            <option value="false">Revalidation</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${s.is_status === false ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {s.is_status === false ? 'Revalidation' : 'Fresh'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === s.id ? (
                          <input type="checkbox" checked={editForm.is_military} onChange={e => setEditForm({...editForm, is_military: e.target.checked})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        ) : s.is_military ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{formatDate(s.updated_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm ${s.is_paid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                          {s.is_paid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
              Showing page <span className="font-bold text-slate-700">{pagination.current_page}</span> of <span className="font-bold text-slate-700">{pagination.last_page}</span>
              <span className="mx-3 text-slate-300">|</span>
              Total Records: <span className="font-bold text-indigo-600">{pagination.total}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => fetchData(pagination.current_page - 1)} disabled={pagination.current_page <= 1} className="px-5 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-semibold hover:bg-white hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 transition-all outline-none">Previous</button>
              <button onClick={() => fetchData(pagination.current_page + 1)} disabled={pagination.current_page >= pagination.last_page} className="px-5 py-2.5 border border-slate-200 shadow-sm rounded-xl text-sm font-semibold hover:bg-white hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 transition-all outline-none">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Add New Student</h2>
                  <p className="text-xs text-slate-500">Fill in the details below to create a student NYSC record</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleAddStudent} className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Personal */}
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>First Name <span className="text-rose-500">*</span></label>
                    <input className={inputCls} placeholder="e.g. John" value={addForm.fname} onChange={e => setAddForm({...addForm, fname: e.target.value})} required />
                  </div>
                  <div>
                    <label className={labelCls}>Middle Name</label>
                    <input className={inputCls} placeholder="e.g. Emeka" value={addForm.mname} onChange={e => setAddForm({...addForm, mname: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name <span className="text-rose-500">*</span></label>
                    <input className={inputCls} placeholder="e.g. Doe" value={addForm.lname} onChange={e => setAddForm({...addForm, lname: e.target.value})} required />
                  </div>
                  <div>
                    <label className={labelCls}>Gender <span className="text-rose-500">*</span></label>
                    <select className={inputCls} value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})} required>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" className={inputCls} value={addForm.dob} onChange={e => setAddForm({...addForm, dob: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} placeholder="08012345678" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>State of Origin</label>
                    <input className={inputCls} placeholder="e.g. Anambra" value={addForm.state} onChange={e => setAddForm({...addForm, state: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" className={inputCls} placeholder="student@email.com" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Academic */}
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Academic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Matric Number <span className="text-rose-500">*</span></label>
                    <input className={`${inputCls} font-mono`} placeholder="e.g. VUG/CSC/20/001" value={addForm.matric_no} onChange={e => setAddForm({...addForm, matric_no: e.target.value})} required />
                  </div>
                  <div>
                    <label className={labelCls}>Student ID</label>
                    <input type="number" className={inputCls} placeholder="e.g. 1001" value={addForm.student_id} onChange={e => setAddForm({...addForm, student_id: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <input className={inputCls} placeholder="e.g. Computer Science" value={addForm.department} onChange={e => setAddForm({...addForm, department: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Course of Study</label>
                    <input className={inputCls} placeholder="e.g. B.Sc Computer Science" value={addForm.course_study} onChange={e => setAddForm({...addForm, course_study: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>JAMB Number</label>
                    <input className={inputCls} placeholder="e.g. 12345678AB" value={addForm.jamb_no} onChange={e => setAddForm({...addForm, jamb_no: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Graduation Year</label>
                    <input className={inputCls} placeholder="e.g. 2024" value={addForm.graduation_year} onChange={e => setAddForm({...addForm, graduation_year: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>CGPA</label>
                    <input type="number" min="0" max="5" step="0.01" className={inputCls} placeholder="e.g. 4.50" value={addForm.cgpa} onChange={e => setAddForm({...addForm, cgpa: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>Class of Degree</label>
                    <select className={inputCls} value={addForm.class_of_degree} onChange={e => setAddForm({...addForm, class_of_degree: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="First Class">First Class</option>
                      <option value="Second Class Upper">Second Class Upper</option>
                      <option value="Second Class Lower">Second Class Lower</option>
                      <option value="Third Class">Third Class</option>
                      <option value="Pass">Pass</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Study Mode</label>
                    <select className={inputCls} value={addForm.study_mode} onChange={e => setAddForm({...addForm, study_mode: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Distance Learning">Distance Learning</option>
                    </select>
                  </div>
                   <div>
                    <label className={labelCls}>Application Status</label>
                    <select className={inputCls} value={String(addForm.is_status)} onChange={e => setAddForm({...addForm, is_status: e.target.value === 'true'})}>
                      <option value="true">Fresh</option>
                      <option value="false">Revalidation</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="add-military" checked={addForm.is_military} onChange={e => setAddForm({...addForm, is_military: e.target.checked})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                    <label htmlFor="add-military" className="text-sm font-semibold text-slate-700">Military Personnel?</label>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddModal(false); setAddForm(emptyForm); }} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 disabled:opacity-60 transition-all"
                >
                  {addLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><CheckIcon className="w-4 h-4" /> Save Student</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Student Documents</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{selectedDocStudent?.name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="font-mono">{selectedDocStudent?.matric_no}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDocModal(false)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {docsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-500 animate-pulse">Retrieving documents...</p>
                </div>
              ) : studentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <DocumentTextIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">No Documents Found</h3>
                  <p className="text-sm text-slate-500 max-w-xs">There are no uploaded documents on record matching this matriculation number.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studentDocs.map((doc, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 transition-all hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                            {doc.name.toLowerCase().includes('pdf') ? (
                              <DocumentTextIcon className="w-6 h-6" />
                            ) : (
                              <EyeIcon className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{doc.name}</h4>
                            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{doc.source}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Document Preview Area */}
                      <div className="w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative group flex items-center justify-center">
                        {doc.url ? (
                          doc.name.toLowerCase().includes('pdf') ? (
                            <iframe src={`${getDocUrl(doc.url)}#view=FitH`} className="w-full h-full pointer-events-none opacity-80" />
                          ) : (
                            <img src={getDocUrl(doc.url)} alt={doc.name} className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500" />
                          )
                        ) : (
                          <span className="text-sm text-slate-400 font-medium tracking-wide">Preview Unavailable</span>
                        )}
                        
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={getDocUrl(doc.url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold shadow-xl hover:bg-slate-50 transition-colors transform translate-y-2 group-hover:translate-y-0 duration-200"
                          >
                            <EyeIcon className="w-4 h-4" /> Open Full Screen
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
               <button onClick={() => setShowDocModal(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Close Viewer
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
