'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminService from '@/services/admin.service';
import { DuplicatePaymentData } from '@/types/admin.types';
import { formatCurrency } from '@/utils/formatters';
import { FaSearch } from 'react-icons/fa';
import { MdPayment, MdWarning } from 'react-icons/md';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/common/Pagination';
import AdminLayout from '@/components/layouts/AdminLayout';

// Create a singleton instance of AdminService
const adminService = AdminService;

export default function DuplicatePaymentsPage() {
  const { user, userType, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [duplicatePayments, setDuplicatePayments] = useState<DuplicatePaymentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user || userType !== 'admin') {
        router.push('/login');
      } else {
        fetchDuplicatePayments();
      }
    }
  }, [user, userType, authLoading, currentPage]);

  const fetchDuplicatePayments = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDuplicatePayments(currentPage, 10, searchTerm);
      setDuplicatePayments(response.duplicatePayments);
      setStats(response.stats);
      setTotalPages(response.totalPages);
      setTotalRecords(response.total);
    } catch (error) {
      console.error('Error fetching duplicate payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDuplicatePayments();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Duplicate Payments Management</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <MdPayment size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Total Duplicate Payments</p>
                  <p className="text-2xl font-semibold">{stats.total_students}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <MdWarning size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Total Overpaid Amount</p>
                  <p className="text-2xl font-semibold">{formatCurrency(stats.total_duplicate_amount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <MdPayment size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Average Overpayment</p>
                  <p className="text-2xl font-semibold">{formatCurrency(stats.average_overpayment)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  placeholder="Search by name, matric number, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Duplicate Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Duplicate Payments
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Students who have made multiple successful payments
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <LoadingSpinner />
            </div>
          ) : !duplicatePayments || duplicatePayments.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-gray-500">No duplicate payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payments
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Paid
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overpayment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {duplicatePayments?.map((item) => (
                    <tr key={item.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.matric_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.payments?.length} payments</div>
                        <div className="text-xs text-gray-500">
                          {item.payments?.map((payment, index) => (
                            <div key={payment.id} className="mb-1">
                              {formatCurrency(payment.amount)} ({new Date(payment.payment_date).toLocaleDateString()})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.total_paid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.expected_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {formatCurrency(item.overpayment)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && duplicatePayments && duplicatePayments.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalRecords={totalRecords}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
