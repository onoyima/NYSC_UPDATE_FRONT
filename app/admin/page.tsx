'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { AdminDashboardCards } from '@/components/common/DashboardCards';
import { LimitedDashboardCards } from '@/components/common/LimitedDashboardCards';
import ProfileSection from '@/components/common/ProfileSection';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AdminUser } from '@/types/auth.types';
import { AdminRole } from '@/types/admin.types';
import { formatDate } from '@/utils/formatters';
import { User, Mail, Phone, MapPin, Briefcase, Heart, Users, FileText, BarChart3, Settings, TrendingUp, Activity, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/admin.service';
import WhatsAppIcon from '@/components/common/WhatsAppIcon';

const AdminDashboard: React.FC = () => {
  const { user, userType, userRole, isLoading } = useAuth();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Define authorized staff IDs
  const authorizedStaffIds = [596, 577, 1, 2, 506];
  const isAuthorizedStaff = admin ? authorizedStaffIds.includes(admin.id) : false;

  // Utility function to format dates
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
      // Use the actual data structure from the backend
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
        paymentAnalytics: response.paymentAnalytics || {
          totalRevenue: 0,
          averageAmount: 0,
          successRate: 0,
          monthlyTrends: []
        }
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
        <LoadingSpinner 
          size="xl" 
          text="Loading admin dashboard..."
          className="animate-scale-in"
        />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Unable to load admin profile</p>
      </div>
    );
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Navbar */}
        <Navbar userType="admin" />
        
        {/* Main Content */}
        <main className="ml-0 md:ml-64 overflow-y-auto h-screen pt-20 p-4 lg:p-6 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
              {/* Enhanced Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Welcome back, {admin.fname} {admin.lname}!
                    </h1>
                    <p className="text-gray-600 text-sm lg:text-base mt-2">
                      {admin.title} | {admin.department}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Here's what's happening with your Student Update Portal today.
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                      {admin.status}
                    </Badge>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>System Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Cards - Role-based */}
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
              ) : !isAuthorizedStaff ? (
                // Limited view for unauthorized staff
                <div className="space-y-6">
                  <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <Settings className="h-5 w-5" />
                        Access Restricted
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        You have limited access to this dashboard. For full administrative features and actions, please contact the system administrator.
                      </p>
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        <p><strong>Your Staff ID:</strong> {admin?.id}</p>
                        <p><strong>Access Level:</strong> View Only</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Enhanced basic dashboard data for unauthorized staff */}
                  {dashboardData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium opacity-90">Total Students</h3>
                            <p className="text-3xl font-bold mt-2">{dashboardData.totalStudents}</p>
                          </div>
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium opacity-90">Completed Payments</h3>
                            <p className="text-3xl font-bold mt-2">{dashboardData.completedPayments}</p>
                          </div>
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium opacity-90">Pending Payments</h3>
                            <p className="text-3xl font-bold mt-2">{dashboardData.pendingPayments}</p>
                          </div>
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium opacity-90">Total Submissions</h3>
                            <p className="text-3xl font-bold mt-2">{dashboardData.totalNyscSubmissions}</p>
                          </div>
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Full dashboard for authorized staff
                <div className="space-y-6">
                  {/* Dashboard Cards */}
                  {(userRole === 'admin' || userRole === 'super_admin') ? (
                    <AdminDashboardCards adminData={dashboardData} />
                  ) : (
                    <LimitedDashboardCards 
                      adminData={dashboardData} 
                      userRole={userRole as 'sub_admin' | 'manager'} 
                    />
                  )}
                </div>
              )}

              {/* Enhanced Tabbed Content - Only show for authorized staff */}
              {isAuthorizedStaff && (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl shadow-sm border border-gray-200">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Enhanced Quick Actions */}
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Quick Actions
                          </CardTitle>
                          <CardDescription>
                            Administrative tools and shortcuts for efficient management
                          </CardDescription>
                        </div>
                        <div className="mt-4 sm:mt-0">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date().toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <Button 
                          variant="outline" 
                          className="group p-6 h-auto border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
                          onClick={() => window.location.href = '/admin/students'}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center group-hover:bg-blue-300 transition-colors">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900">Manage Students</h4>
                              <p className="text-sm text-gray-600">View and manage student records</p>
                              <div className="flex items-center mt-2 text-xs text-blue-600">
                                <span>{dashboardData?.totalStudents || 0} active students</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="group p-6 h-auto border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200"
                          onClick={() => window.location.href = '/admin/exports'}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center group-hover:bg-green-300 transition-colors">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900">Export Data</h4>
                              <p className="text-sm text-gray-600">Generate and download reports</p>
                              <div className="flex items-center mt-2 text-xs text-green-600">
                                <span>CSV, Excel, PDF formats</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="group p-6 h-auto border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200"
                          onClick={() => window.location.href = '/admin/settings'}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center group-hover:bg-purple-300 transition-colors">
                              <Settings className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900">System Settings</h4>
                              <p className="text-sm text-gray-600">Configure system preferences</p>
                              <div className="flex items-center mt-2 text-xs text-purple-600">
                                <span>Payment, Email, System</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="group p-6 h-auto border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200"
                          onClick={() => window.location.href = '/admin/payments'}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center group-hover:bg-orange-300 transition-colors">
                              <DollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900">Payment Management</h4>
                              <p className="text-sm text-gray-600">Monitor payment transactions</p>
                              <div className="flex items-center mt-2 text-xs text-orange-600">
                                <span>{dashboardData?.completedPayments || 0} completed</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="group p-6 h-auto border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200"
                          onClick={() => window.location.href = '/admin/submissions'}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-teal-200 rounded-lg flex items-center justify-center group-hover:bg-teal-300 transition-colors">
                              <FileText className="w-6 h-6 text-teal-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900">Submissions</h4>
                              <p className="text-sm text-gray-600">Review student submissions</p>
                              <div className="flex items-center mt-2 text-xs text-teal-600">
                                <span>{dashboardData?.totalTempSubmissions || 0} pending</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="group p-6 h-auto border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200"
                          onClick={() => window.location.href = '/admin/roles'}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-12 h-12 bg-indigo-200 rounded-lg flex items-center justify-center group-hover:bg-indigo-300 transition-colors">
                              <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-gray-900">Role Management</h4>
                              <p className="text-sm text-gray-600">Manage user roles and permissions</p>
                              <div className="flex items-center mt-2 text-xs text-indigo-600">
                                <span>Admin access control</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>
                        Latest system activities and updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData?.recentUpdates?.slice(0, 5).map((update: any, index: number) => (
                          <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {update.student_name || 'Student'} updated their profile
                              </p>
                              <p className="text-xs text-gray-500">
                                 {formatDateLocal(update.updated_at || new Date())}
                               </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {update.status || 'Updated'}
                            </Badge>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No recent activity to display</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  {/* Enhanced Analytics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold text-blue-900">
                              ₦{(dashboardData?.paymentAnalytics?.totalRevenue || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-green-600 font-medium">+12.5%</span>
                          <span className="text-gray-600 ml-1">from last month</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Success Rate</p>
                            <p className="text-2xl font-bold text-green-900">
                              {dashboardData?.paymentAnalytics?.successRate || 0}%
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-green-600 font-medium">+8.2%</span>
                          <span className="text-gray-600 ml-1">from last month</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Avg. Payment</p>
                            <p className="text-2xl font-bold text-purple-900">
                              ₦{(dashboardData?.paymentAnalytics?.averageAmount || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-green-600 font-medium">+5.1%</span>
                          <span className="text-gray-600 ml-1">from last month</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-600 text-sm font-medium">Active Students</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {dashboardData?.totalStudents || 0}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="flex items-center mt-4 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-green-600 font-medium">+18.7%</span>
                          <span className="text-gray-600 ml-1">from last month</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Distribution Chart */}
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Department Distribution
                        </CardTitle>
                        <CardDescription>
                          Student enrollment by department
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            count: {
                              label: "Students",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[300px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData?.departmentBreakdown?.slice(0, 8) || []}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="department" 
                                className="text-xs"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis className="text-xs" />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar 
                                dataKey="count" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]}
                                className="fill-primary"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Gender Distribution Pie Chart */}
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Gender Distribution
                        </CardTitle>
                        <CardDescription>
                          Student gender breakdown
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            male: {
                              label: "Male",
                              color: "#3b82f6",
                            },
                            female: {
                              label: "Female",
                              color: "#ec4899",
                            },
                          }}
                          className="h-[300px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={dashboardData?.genderBreakdown || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ gender, percentage }) => `${gender}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                              >
                                {(dashboardData?.genderBreakdown || []).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#ec4899'} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payment Trends Chart */}
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Payment Trends
                      </CardTitle>
                      <CardDescription>
                        Monthly payment analytics and trends
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Revenue",
                            color: "hsl(var(--chart-1))",
                          },
                          payments: {
                            label: "Payments",
                            color: "hsl(var(--chart-2))",
                          },
                        }}
                        className="h-[400px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboardData?.paymentAnalytics?.monthlyTrends || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" className="text-xs" />
                            <YAxis className="text-xs" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stackId="1"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.6}
                            />
                            <Area
                              type="monotone"
                              dataKey="payments"
                              stackId="1"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="profile">
                  <ProfileSection userType="admin" />
                </TabsContent>

                <TabsContent value="settings">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">System Configuration</CardTitle>
                      <CardDescription>
                        System settings and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Settings className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                              Advanced system settings are available in the dedicated Settings page.
                              <a href="/admin/settings" className="font-medium underline hover:text-yellow-900 ml-1">
                                Go to Settings
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              )}
            </div>
          </main>
      
      {/* WhatsApp Icon */}
      <WhatsAppIcon />
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;