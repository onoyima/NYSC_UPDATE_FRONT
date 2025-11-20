'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import adminService from '@/services/admin.service';
import { PaymentRecord, PaymentStatisticsResponse } from '@/types/admin.types';
import { toast } from 'sonner';
import { BanknotesIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export default function PaymentStatisticsPage() {
  const { user, userType, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<PaymentStatisticsResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [amountType, setAmountType] = useState<'standard' | 'late' | ''>('');
  const [duplicates, setDuplicates] = useState<'all' | 'only' | 'exclude'>('exclude');
  const [studentsForHide, setStudentsForHide] = useState<{ student_id: number; name: string; matric: string; department?: string; count: number }[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [hideMode, setHideMode] = useState<'all' | 'duplicates'>('all');
  const [hideAction, setHideAction] = useState<'hide' | 'unhide'>('hide');

  const canHide = useMemo(() => {
    const email = String((user as any)?.email || (user as any)?.p_email || '').toLowerCase();
    return userType === 'admin' && email === 'onoyimab@veritas.edu.ng';
  }, [user, userType]);

  const isSuperAdmin = useMemo(() => {
    const id = Number((user as any)?.id);
    return userType === 'admin' && id === 596;
  }, [user, userType]);

  const fetchStats = async () => {
      try {
        setIsLoadingData(true);
        const response = await adminService.getPaymentStatistics({
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
          payment_method: paymentMethod || undefined,
          department: department || undefined,
          amount_type: amountType || undefined,
          duplicates: duplicates || undefined,
        });
        setStats(response);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to load payment statistics');
      } finally {
        setIsLoadingData(false);
      }
  };
  useEffect(() => {
    if (userType === 'admin') {
      fetchStats();
    }
  }, [userType, dateStart, dateEnd, paymentMethod, department, amountType, duplicates]);

  const departments = useMemo(() => {
    if (!stats?.department_breakdown) return [] as string[];
    return Object.keys(stats.department_breakdown);
  }, [stats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  };

  const loadStudentsForHide = async () => {
    try {
      setIsLoadingStudents(true);
      const res = await adminService.getPayments(1, 500, {
        status: 'successful',
        method: paymentMethod || undefined,
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
      });
      const byStudent = new Map<number, { student_id: number; name: string; matric: string; department?: string; count: number }>();
      (res.payments || []).forEach((p: PaymentRecord) => {
        const existing = byStudent.get(p.student_id);
        if (existing) {
          existing.count += 1;
        } else {
          byStudent.set(p.student_id, {
            student_id: p.student_id,
            name: p.student_name,
            matric: p.matric_number,
            department: p.department,
            count: 1,
          });
        }
      });
      setStudentsForHide(Array.from(byStudent.values()));
      setSelectedStudentIds([]);
    } catch (e: any) {
      toast.error('Failed to load students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const toggleSelectStudent = (id: number) => {
    setSelectedStudentIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === studentsForHide.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(studentsForHide.map(s => s.student_id));
    }
  };

  const exportStats = async (format: 'csv' | 'excel') => {
    try {
      const blob = await adminService.exportPaymentStatistics({
        format,
        filters: {
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
          payment_method: paymentMethod || undefined,
          department: department || undefined,
          amount_type: amountType || undefined,
          duplicates: duplicates || undefined,
        },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-statistics.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    }
  };

  const hideSelected = async () => {
    if (!canHide) return;
    if (selectedStudentIds.length === 0) {
      toast.error('Select students to hide');
      return;
    }
    try {
      const res = await adminService.hideStudentsPayments(selectedStudentIds, { mode: hideMode, action: hideAction });
      toast.success('Payments hidden');
      setSelectedStudentIds([]);
      await fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to hide payments');
    }
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
        <Sidebar />
        <Navbar userType="admin" />
        <main className="ml-0 md:ml-64 pt-20 p-4 md:p-6 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Statistics</h1>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive audit with filters and export</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportStats('csv')} className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
                <button onClick={() => exportStats('excel')} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export Excel
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Start Date</label>
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">End Date</label>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">All</option>
                    <option value="paystack">Paystack</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Amount</label>
                  <select value={amountType} onChange={e => setAmountType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">All</option>
                    <option value="standard">Normal Fee</option>
                    <option value="late">Late Fee</option>
                  </select>
                </div>
                {isSuperAdmin && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300">Duplicates</label>
                    <select value={duplicates} onChange={e => setDuplicates(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="all">All</option>
                      <option value="only">Only Duplicates</option>
                      <option value="exclude">Exclude Duplicates</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">All</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={fetchStats} className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : stats ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                  <h2 className="text-lg font-semibold mb-4">Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Students Paid</span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">{stats.summary.total_students_paid}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount Paid</span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.summary.total_successful_amount)}</span>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Duplicates</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">{stats.summary.duplicate_payments_count}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Normal Fees</span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">{stats.summary.normal_fee_count}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Late Fees</span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">{stats.summary.late_fee_count}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.summary.total_successful_amount)}</p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full"><BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" /></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Successful Payments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.total_successful_payments}</p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full"><CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" /></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Students Paid</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.total_students_paid}</p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full"><ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Hidden Students</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.hidden_students_count}</p>
                      </div>
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full"><ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" /></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold mb-4">Department Breakdown</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Payments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Students</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(stats.department_breakdown).map(([dept, item]) => (
                            <tr key={dept}>
                              <td className="px-6 py-3">{dept}</td>
                              <td className="px-6 py-3">{item.count}</td>
                              <td className="px-6 py-3">{item.students}</td>
                              <td className="px-6 py-3">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold mb-4">Fee Breakdown</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Normal Fee Count</span><span>{stats.summary.normal_fee_count}</span></div>
                      <div className="flex justify-between"><span>Normal Fee Amount</span><span>{formatCurrency(stats.summary.normal_fee_amount)}</span></div>
                      <div className="flex justify-between"><span>Late Fee Count</span><span>{stats.summary.late_fee_count}</span></div>
                      <div className="flex justify-between"><span>Late Fee Amount</span><span>{formatCurrency(stats.summary.late_fee_amount)}</span></div>
                    </div>
                    {isSuperAdmin && (
                      <>
                        <h2 className="text-lg font-semibold mt-6 mb-2">Duplicates</h2>
                        <div className="space-y-2">
                          <div className="flex justify-between"><span>Duplicate Students</span><span>{stats.summary.duplicate_students_count}</span></div>
                          <div className="flex justify-between"><span>Duplicate Payments</span><span>{stats.summary.duplicate_payments_count}</span></div>
                          <div className="flex justify-between"><span>Duplicate Amount</span><span>{formatCurrency(stats.summary.duplicate_total_amount)}</span></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {canHide && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Hide Student Payments</h2>
                      <div className="flex gap-2">
                        <button onClick={loadStudentsForHide} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg">Load Students</button>
                        <select value={hideMode} onChange={e => setHideMode(e.target.value as any)} className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value="all">All payments</option>
                          {isSuperAdmin && <option value="duplicates">Duplicate payments only</option>}
                        </select>
                        <select value={hideAction} onChange={e => setHideAction(e.target.value as any)} className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value="hide">Hide</option>
                          <option value="unhide">Unhide</option>
                        </select>
                        <button onClick={hideSelected} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Apply</button>
                      </div>
                    </div>
                    {isLoadingStudents ? (
                      <div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left">
                                  <input type="checkbox" checked={selectedStudentIds.length === studentsForHide.length && studentsForHide.length > 0} onChange={selectAllStudents} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Matric</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Payments</th>
                                {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Duplicate</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {studentsForHide.map((s, idx) => (
                                <tr key={s.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-6 py-3">
                                    <input type="checkbox" checked={selectedStudentIds.includes(s.student_id)} onChange={() => toggleSelectStudent(s.student_id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                  </td>
                                  <td className="px-6 py-3">{s.name}</td>
                                  <td className="px-6 py-3">{s.matric}</td>
                                  <td className="px-6 py-3">{s.department || 'N/A'}</td>
                                  <td className="px-6 py-3">{s.count}</td>
                                  {isSuperAdmin && <td className="px-6 py-3">{s.count > 1 ? 'Yes' : 'No'}</td>}
                              </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-gray-600 dark:text-gray-400">No statistics available</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}