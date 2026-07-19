'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AdminUser } from '@/types/auth.types';
import { Users, FileText, BarChart3, Activity, User, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';
import ProfileSection from '@/components/common/ProfileSection';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StaffDashboard: React.FC = () => {
  const { user, userType, isLoading } = useAuth();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const formatDateLocal = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchDashboardData = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setDashboardData({
        totalStudents: response.totalStudents || 0,
        totalTempSubmissions: response.totalTempSubmissions || 0,
        confirmedData: response.confirmedData || 0,
        completedPayments: response.completedPayments || 0,
        pendingPayments: response.pendingPayments || 0,
        totalNyscSubmissions: response.totalNyscSubmissions || 0,
        recentUpdates: response.recentUpdates || [],
        departmentBreakdown: response.departmentBreakdown || [],
        genderBreakdown: response.genderBreakdown || [],
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && userType === 'admin') {
      setAdmin(user as AdminUser);
      fetchDashboardData();
    }
  }, [user, userType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <LoadingSpinner size="xl" text="Loading staff dashboard..." className="animate-scale-in" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Unable to load profile</p>
      </div>
    );
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <Navbar userType="admin" />

        <main className="ml-0 md:ml-64 overflow-y-auto h-screen pt-28 md:pt-32 pb-24 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="bg-background rounded-xl border p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Welcome, {admin.fname} {admin.lname}!
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base mt-2">
                    Student Data Update Portal — Staff View
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    View student data update statistics and submissions.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="default">Staff</Badge>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>System Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards — Student Data Only */}
            {isLoadingData ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-0 pb-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Total Students</h3>
                      <p className="text-3xl font-bold mt-2">{dashboardData?.totalStudents || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Confirmed Data</h3>
                      <p className="text-3xl font-bold mt-2">{dashboardData?.confirmedData || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Pending Submissions</h3>
                      <p className="text-3xl font-bold mt-2">{dashboardData?.totalTempSubmissions || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Total Submissions</h3>
                      <p className="text-3xl font-bold mt-2">{dashboardData?.totalNyscSubmissions || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-background rounded-xl border">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Department Breakdown */}
                {dashboardData?.departmentBreakdown?.length > 0 && (
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Department Breakdown
                      </CardTitle>
                      <CardDescription>Student data updates by department</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.departmentBreakdown.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gender Breakdown */}
                {dashboardData?.genderBreakdown?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Gender Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={dashboardData.genderBreakdown}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="count"
                                nameKey="gender"
                                label={({ gender, percentage }) => `${gender} (${percentage}%)`}
                              >
                                {dashboardData.genderBreakdown.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Updates */}
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Recent Data Updates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {dashboardData?.recentUpdates?.slice(0, 8).map((update: any, index: number) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {update.student_name || 'Student'} updated their profile
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDateLocal(update.updated_at || new Date())}
                                </p>
                              </div>
                            </div>
                          )) || (
                            <div className="text-center py-8 text-gray-500">
                              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No recent updates</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* No Data State */}
                {!isLoadingData && !dashboardData?.departmentBreakdown?.length && (
                  <Card className="shadow-sm border border-gray-200">
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No data available yet. Statistics will appear once students start updating their information.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total Students</p>
                          <p className="text-2xl font-bold text-blue-900">{dashboardData?.totalStudents || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Data Confirmed</p>
                          <p className="text-2xl font-bold text-green-900">{dashboardData?.confirmedData || 0}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">Submissions</p>
                          <p className="text-2xl font-bold text-purple-900">{dashboardData?.totalNyscSubmissions || 0}</p>
                        </div>
                        <FileText className="w-8 h-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="profile">
                <ProfileSection userType="admin" />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StaffDashboard;
