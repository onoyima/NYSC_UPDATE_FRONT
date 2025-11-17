'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserPlusIcon,
  DocumentArrowDownIcon,
  CreditCardIcon,
  DocumentCheckIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

import { RolePermissions } from '@/types/admin.types';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  permission?: keyof RolePermissions;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const QuickActions: React.FC = () => {
  const { hasPermission, userType, user, userRole } = useAuth();

  const isSuperAdmin = userType === 'admin' && user?.id === 596;

  const quickActions: QuickAction[] = [
    {
      id: 'excel-import',
      title: 'Excel Import',
      description: 'Import data from CSV files',
      icon: DocumentTextIcon,
      href: '/admin/excel-import',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      id: 'add-student',
      title: 'Add Student',
      description: 'Register new student for NYSC',
      icon: UserPlusIcon,
      href: '/admin/students/add',
      color: 'bg-blue-500 hover:bg-blue-600',
      permission: 'canAddStudentNysc'
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download student records',
      icon: DocumentArrowDownIcon,
      href: '/admin/export',
      color: 'bg-green-500 hover:bg-green-600',
      permission: 'canDownloadData'
    },
    {
      id: 'payment-overview',
      title: 'Payment Overview',
      description: 'View payment statistics',
      icon: CreditCardIcon,
      href: '/admin/payments',
      color: 'bg-purple-500 hover:bg-purple-600',
      permission: 'canViewPayments'
    },
    {
      id: 'payment-statistics',
      title: 'Payment Statistics',
      description: 'Analyze payments by department and fees',
      icon: ChartBarIcon,
      href: '/admin/payment-statistics',
      color: 'bg-violet-500 hover:bg-violet-600',
      permission: 'canViewPayments'
    },
    {
      id: 'pending-submissions',
      title: 'Pending Reviews',
      description: 'Review temp submissions',
      icon: DocumentCheckIcon,
      href: '/admin/submissions/pending',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      permission: 'canViewTempSubmissions'
    },
    {
      id: 'student-management',
      title: 'Student Management',
      description: 'Manage student records',
      icon: UsersIcon,
      href: '/admin/students',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      permission: 'canViewStudentNysc'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: ChartBarIcon,
      href: '/admin/analytics',
      color: 'bg-pink-500 hover:bg-pink-600',
      permission: 'canViewAnalytics'
    },
    {
      id: 'role-management',
      title: 'Role Management',
      description: 'Assign user roles',
      icon: Cog6ToothIcon,
      href: '/admin/roles',
      color: 'bg-red-500 hover:bg-red-600',
      superAdminOnly: true
    },
    {
      id: 'system-alerts',
      title: 'System Alerts',
      description: 'View system notifications',
      icon: ExclamationTriangleIcon,
      href: '/admin/alerts',
      color: 'bg-orange-500 hover:bg-orange-600',
      adminOnly: true
    }
  ];

  const filteredActions = quickActions.filter(action => {
    const email = String((user as any)?.email || (user as any)?.p_email || '').toLowerCase();
    if (action.href === '/admin/payment-statistics') {
      if (email === 'onoyimab@veritas.edu.ng' || email === 'agbudug@veritas.edu.ng') {
        return true;
      }
    }
    if (action.superAdminOnly && !isSuperAdmin) {
      return false;
    }
    if (action.adminOnly && userType !== 'admin') {
      return false;
    }
    if (action.permission && !hasPermission(action.permission)) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredActions.length} available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.id}
              href={action.href}
              className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg text-white ${action.color} transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {action.description}
                </p>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-8">
          <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No quick actions available for your role.
          </p>
        </div>
      )}

      {/* Additional info for role-based access */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Cog6ToothIcon className="h-4 w-4" />
          <span>
            Showing actions available for your role: 
            <span className="font-medium text-gray-900 dark:text-white ml-1">
              {isSuperAdmin ? 'Super Admin' : userRole === 'admin' ? 'Admin' : userRole === 'sub_admin' ? 'Sub Admin' : userRole === 'manager' ? 'Manager' : 'User'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;