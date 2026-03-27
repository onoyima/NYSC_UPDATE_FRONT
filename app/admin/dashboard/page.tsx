'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardStats from '@/components/admin/DashboardStats';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import RecentActivity from '@/components/admin/RecentActivity';
import QuickActions from '@/components/admin/QuickActions';
import ExportButton from '@/components/admin/ExportButton';
import NyscExportButton from '@/components/admin/NyscExportButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PendingPaymentsWidget from '@/components/admin/PendingPaymentsWidget';
import { AdminDashboardStats } from '@/types/admin.types';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';

const AdminDashboard = () => {
  const { user, userType, userRole, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<AdminDashboardStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!hasPermission('canViewAnalytics')) {
        toast.error('You do not have permission to access this page');
        router.push('/admin');
        return;
      }
    }
  }, [userType, hasPermission, isLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoadingData(true);
        const dashboardStats = await adminService.getDashboardStats(selectedMonth, selectedYear);
        setDashboardData(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (userType === 'admin' && hasPermission('canViewAnalytics')) {
      fetchDashboardData();
    }
  }, [userType, hasPermission, selectedMonth, selectedYear]);

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
        
        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {user?.fname || user?.name}! Here&apos;s your NYSC management overview.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Role: {userRole?.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  {/* Month Filter */}
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>

                  {/* Year Filter */}
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Export Actions */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Export Data</span>
                <div className="flex gap-2">
                  <NyscExportButton size="sm" />
                  <ExportButton />
                </div>
              </div>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : dashboardData ? (
            <div className="space-y-8">
              {/* Dashboard Stats */}
              <DashboardStats data={dashboardData} />
              
              {/* Pending Payments Widget */}
              <PendingPaymentsWidget />
              
              {/* Quick Actions */}
              <QuickActions />
              
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Analytics Charts - Takes 2 columns */}
                <div className="xl:col-span-2">
                  <AnalyticsCharts data={dashboardData} />
                </div>
                
                {/* Recent Activity - Takes 1 column */}
                <div className="xl:col-span-1">
                  <RecentActivity />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Failed to load dashboard data. Please try refreshing the page.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;