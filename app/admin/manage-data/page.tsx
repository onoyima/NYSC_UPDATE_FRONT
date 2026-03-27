'use client';

import React, { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { 
  ExclamationTriangleIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';

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
  updated_at: string;
}

const formatDate = (iso: string): string => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

export default function ManageDataPage() {
  const { isAuthenticated, userType } = useAuth();
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<StudentData>>({});

  const isAdmin = isAuthenticated && userType === 'admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/nysc/admin/students-data');
      setData(res.data.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this record?')) return;
    try {
      await axios.delete(`/api/nysc/admin/student/${id}`);
      toast.success('Record deleted successfully');
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const startEdit = (student: StudentData) => {
    setEditingId(student.id);
    setEditForm(student);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await axios.put(`/api/nysc/admin/student/${editForm.student_id}`, editForm);
      toast.success('Record updated successfully');
      setData(prev => prev.map(item => item.id === editingId ? { ...item, ...editForm } as StudentData : item));
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update record');
    }
  };

  const filtered = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  if (!isAdmin) return <div className="p-8 text-center">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
             <h1 className="text-xl font-bold text-slate-900">Data Management Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
             <Link href="/admin/data" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">View Mode</Link>
             <button onClick={fetchData} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-sm font-semibold">Refresh</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Global search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
               <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
               <span>Editing records here impacts the final senate upload list.</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Actions</th>
                  <th className="px-6 py-4 text-left">Matric No</th>
                  <th className="px-6 py-4 text-left">First Name</th>
                  <th className="px-6 py-4 text-left">Surname</th>
                  <th className="px-6 py-4 text-left">Dept</th>
                  <th className="px-6 py-4 text-left">CGPA</th>
                  <th className="px-6 py-4 text-left">Phone</th>
                  <th className="px-6 py-4 text-left">Gender</th>
                  <th className="px-6 py-4 text-left">State</th>
                  <th className="px-6 py-4 text-left">Grad Year</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <tr key={s.id} className={`group hover:bg-indigo-50/30 transition-colors ${editingId === s.id ? 'bg-indigo-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === s.id ? (
                        <div className="flex items-center space-x-2">
                           <button onClick={handleUpdate} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><CheckIcon className="w-4 h-4" /></button>
                           <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => startEdit(s)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><PencilIcon className="w-4 h-4" /></button>
                           <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
                      {editingId === s.id ? (
                        <input className="w-32 border rounded px-2 py-1" value={editForm.matric_no} onChange={e => setEditForm({...editForm, matric_no: e.target.value})} />
                      ) : s.matric_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {editingId === s.id ? (
                        <input className="w-32 border rounded px-2 py-1" value={editForm.fname} onChange={e => setEditForm({...editForm, fname: e.target.value})} />
                      ) : s.fname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {editingId === s.id ? (
                        <input className="w-32 border rounded px-2 py-1" value={editForm.lname} onChange={e => setEditForm({...editForm, lname: e.target.value})} />
                      ) : s.lname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {editingId === s.id ? (
                        <input className="w-40 border rounded px-2 py-1" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                      ) : s.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === s.id ? (
                        <input className="w-16 border rounded px-2 py-1" value={editForm.cgpa} onChange={e => setEditForm({...editForm, cgpa: e.target.value})} />
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">{s.cgpa}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                       {editingId === s.id ? (
                        <input className="w-32 border rounded px-2 py-1" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                      ) : s.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                       {editingId === s.id ? (
                        <select className="border rounded px-2 py-1" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                           <option value="male">Male</option>
                           <option value="female">Female</option>
                        </select>
                      ) : s.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                       {editingId === s.id ? (
                        <input className="w-32 border rounded px-2 py-1" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} />
                      ) : s.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                       {editingId === s.id ? (
                        <input className="w-20 border rounded px-2 py-1" value={editForm.graduation_year} onChange={e => setEditForm({...editForm, graduation_year: e.target.value})} />
                      ) : s.graduation_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_paid ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          {s.is_paid ? 'Paid' : 'Unpaid'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
             Total Records: {filtered.length} | showing all records for the active session.
          </div>
        </div>
      </div>
    </div>
  );
}
