'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { AdminRole, RolePermissions, roleDisplayNames } from '@/types/auth.types';
import { getRolePermissions } from '@/utils/rolePermissions';

interface AdminUser {
  id: number;
  staff_id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: RolePermissions;
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface RoleAssignmentModal {
  isOpen: boolean;
  user: AdminUser | null;
  mode: 'create' | 'edit';
}

const RoleManagement: React.FC = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<AdminRole | ''>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState<RoleAssignmentModal>({
    isOpen: false,
    user: null,
    mode: 'create'
  });
  const [formData, setFormData] = useState({
    staff_id: '',
    name: '',
    email: '',
    role: 'manager' as AdminRole,
    status: 'active' as 'active' | 'inactive'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = user?.id === 596;

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!isSuperAdmin) {
        toast.error('Only super admin can access role management');
        router.push('/admin');
        return;
      }
    }
  }, [userType, isSuperAdmin, isLoading, router]);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        setIsLoadingData(true);
        const response = await adminService.getAdminUsers(searchTerm, statusFilter);
        
        if (response.success) {
          setAdminUsers(response.users);
        } else {
          toast.error(response.message || 'Failed to load admin users');
        }
      } catch (error) {
        console.error('Error fetching admin users:', error);
        toast.error('Failed to load admin users');
      } finally {
        setIsLoadingData(false);
      }
    };

    if (userType === 'admin' && isSuperAdmin) {
      fetchAdminUsers();
    }
  }, [userType, isSuperAdmin]);

  // Filter users
  const filteredUsers = adminUsers.filter(adminUser => {
    const matchesSearch = 
      adminUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminUser.staff_id.includes(searchTerm);
    
    const matchesRole = !filterRole || adminUser.role === filterRole;
    const matchesStatus = !filterStatus || adminUser.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: AdminRole) => {
    const configs = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      sub_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      manager: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${configs[role]}`}>
        <ShieldCheckIcon className="h-3 w-3 mr-1" />
        {roleDisplayNames[role]}
      </span>
    );
  };

  const getStatusBadge = (status: 'active' | 'inactive') => {
    const configs = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${configs[status]}`}>
        {status === 'active' ? (
          <CheckCircleIcon className="h-3 w-3 mr-1" />
        ) : (
          <XMarkIcon className="h-3 w-3 mr-1" />
        )}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openModal = (mode: 'create' | 'edit', adminUser?: AdminUser) => {
    setModal({ isOpen: true, user: adminUser || null, mode });
    if (mode === 'edit' && adminUser) {
      setFormData({
        staff_id: adminUser.staff_id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      });
    } else {
      setFormData({
        staff_id: '',
        name: '',
        email: '',
        role: 'manager',
        status: 'active'
      });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, user: null, mode: 'create' });
    setFormData({
      staff_id: '',
      name: '',
      email: '',
      role: 'manager',
      status: 'active'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.staff_id || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Split name into first and last name
    const nameParts = formData.name.trim().split(' ');
    const fname = nameParts[0] || '';
    const lname = nameParts.slice(1).join(' ') || '';

    try {
      setIsProcessing(true);
      
      if (modal.mode === 'create') {
        // For create mode, password is required
        const password = prompt('Enter password for new user:');
        if (!password) {
          toast.error('Password is required for new users');
          setIsProcessing(false);
          return;
        }

        const response = await adminService.createAdminUser({
          staff_id: formData.staff_id,
          fname,
          lname,
          email: formData.email,
          password,
          role: formData.role,
          status: formData.status
        });
        
        if (response.success) {
          setAdminUsers(prev => [...prev, response.user]);
          toast.success(response.message || 'Admin user created successfully');
        } else {
          toast.error(response.message || 'Failed to create admin user');
          return;
        }
      } else {
        const updateData: any = {
          staff_id: formData.staff_id,
          fname,
          lname,
          email: formData.email,
          role: formData.role,
          status: formData.status
        };

        // Ask if user wants to update password
        const updatePassword = confirm('Do you want to update the password?');
        if (updatePassword) {
          const password = prompt('Enter new password:');
          if (password) {
            updateData.password = password;
          }
        }
        
        const response = await adminService.updateAdminUser(modal.user!.id, updateData);
        
        if (response.success) {
          setAdminUsers(prev => prev.map(u => 
            u.id === modal.user?.id ? response.user : u
          ));
          toast.success(response.message || 'Admin user updated successfully');
        } else {
          toast.error(response.message || 'Failed to update admin user');
          return;
        }
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving admin user:', error);
      toast.error('Failed to save admin user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (adminUser: AdminUser) => {
    if (adminUser.id === 596) {
      toast.error('Cannot delete super admin account');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${adminUser.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await adminService.deleteAdminUser(adminUser.id);
      
      if (response.success) {
        setAdminUsers(prev => prev.filter(u => u.id !== adminUser.id));
        toast.success(response.message || 'Admin user deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete admin user');
      }
    } catch (error) {
      console.error('Error deleting admin user:', error);
      toast.error('Failed to delete admin user');
    }
  };

  const toggleStatus = async (adminUser: AdminUser) => {
    if (adminUser.id === 596) {
      toast.error('Cannot modify super admin status');
      return;
    }

    try {
      const newStatus = adminUser.status === 'active' ? 'inactive' : 'active';
      
      // Split name into first and last name for API call
      const nameParts = adminUser.name.trim().split(' ');
      const fname = nameParts[0] || '';
      const lname = nameParts.slice(1).join(' ') || '';
      
      const response = await adminService.updateAdminUser(adminUser.id, {
        staff_id: adminUser.staff_id,
        fname,
        lname,
        email: adminUser.email,
        role: adminUser.role,
        status: newStatus
      });
      
      if (response.success) {
        setAdminUsers(prev => prev.map(u => 
          u.id === adminUser.id ? response.user : u
        ));
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userType !== 'admin' || !isSuperAdmin) {
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Role Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage admin users and their roles
                </p>
              </div>
              <button
                onClick={() => openModal('create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Admin User
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {adminUsers.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {adminUsers.filter(u => u.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Roles Assigned</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(adminUsers.map(u => u.role)).size}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <KeyIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search admin users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Role Filter */}
              <div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as AdminRole | '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="sub_admin">Sub Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((adminUser, index) => (
                      <tr 
                        key={adminUser.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {adminUser.name}
                              {adminUser.id === 596 && (
                                <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                                  (Super Admin)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {adminUser.email}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Staff ID: {adminUser.staff_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(adminUser.role)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(adminUser.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(adminUser.last_login || '')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openModal('edit', adminUser)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit User"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            
                            {adminUser.id !== 596 && (
                              <>
                                <button
                                  onClick={() => toggleStatus(adminUser)}
                                  className={`p-1 ${
                                    adminUser.status === 'active'
                                      ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                                      : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                                  }`}
                                  title={adminUser.status === 'active' ? 'Deactivate' : 'Activate'}
                                >
                                  {adminUser.status === 'active' ? (
                                    <XMarkIcon className="h-4 w-4" />
                                  ) : (
                                    <CheckCircleIcon className="h-4 w-4" />
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleDelete(adminUser)}
                                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete User"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modal.mode === 'create' ? 'Add Admin User' : 'Edit Admin User'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staff ID *
                  </label>
                  <input
                    type="text"
                    value={formData.staff_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, staff_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as AdminRole }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="manager">Manager</option>
                    <option value="sub_admin">Sub Admin</option>
                    {modal.user?.id !== 596 && <option value="admin">Admin</option>}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      modal.mode === 'create' ? 'Create User' : 'Update User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
};

export default RoleManagement;