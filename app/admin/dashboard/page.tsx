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
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AdminDashboardStats } from '@/types/admin.types';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';

const AdminDashboard = () => {
  const { user, userType, userRole, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<AdminDashboardStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        // Fetch real data from the backend API
        const dashboardStats = await adminService.getDashboardStats();
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
  }, [userType, hasPermission]);

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.fname || user?.name}! Here's your NYSC management overview.
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Role: {userRole?.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleString()}
              </span>
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