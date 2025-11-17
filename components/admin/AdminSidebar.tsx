'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { hasPermission, userRole, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      permission: 'canViewAnalytics'
    },
    {
      name: 'Student Student Data',
      href: '/admin/student-nysc',
      icon: UsersIcon,
      permission: 'canViewStudentNysc'
    },
    {
      name: 'Data Management',
      href: '/data',
      icon: DocumentTextIcon,
      permission: 'canViewStudentNysc'
    },
    {
      name: 'Payment Management',
      href: '/admin/payments',
      icon: CreditCardIcon,
      permission: 'canViewPayments'
    },
    {
      name: 'Payment Statistics',
      href: '/admin/payment-statistics',
      icon: ChartBarIcon,
      permission: 'canViewPayments'
    },
    {
      name: 'Duplicate Payments',
      href: '/admin/duplicate-payments',
      icon: CreditCardIcon,
      permission: 'canViewPayments'
    },
    {
      name: 'Temp Submissions',
      href: '/admin/temp-submissions',
      icon: ClipboardDocumentListIcon,
      permission: 'canViewTempSubmissions'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      permission: 'canViewAnalytics'
    },
    {
      name: 'Data Export',
      href: '/admin/export',
      icon: ArrowDownTrayIcon,
      permission: 'canDownloadData'
    },
    {
      name: 'Excel Import',
      href: '/admin/excel-import',
      icon: DocumentTextIcon,
      permission: 'canManageSystem'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UserGroupIcon,
      permission: 'canAssignRoles'
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: Cog6ToothIcon,
      permission: 'canManageSystem'
    },
  ];

  // Add console log to debug permissions
  console.log('User permissions:', userRole);
  
  // Filter items based on permissions
  const filteredItems = navigationItems.filter(item => {
    const email = String((user as any)?.email || (user as any)?.p_email || '').toLowerCase();
    if (item.href === '/admin/payment-statistics') {
      return email === 'onoyimab@veritas.edu.ng' || email === 'agbudug@veritas.edu.ng';
    }
    if (!item.permission) return true;
    const hasAccess = hasPermission(item.permission as any);
    console.log(`Item: ${item.name}, Permission: ${item.permission}, Has Access: ${hasAccess}`);
    return hasAccess;
  });
  
  // Use filtered items directly
  const filteredNavItems = filteredItems;

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose(); // Close sidebar on mobile after navigation
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      <Transition
        show={isOpen}
        enter="transition-opacity ease-linear duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-linear duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
          onClick={onClose}
        />
      </Transition>

      {/* Sidebar */}
      <Transition
        show={isOpen}
        enter="transition ease-in-out duration-300 transform"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-300 transform"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg md:translate-x-0 md:static md:inset-0">
          {/* Mobile close button */}
          <div className="absolute top-0 right-0 -mr-12 pt-2 md:hidden">
            <button
              onClick={onClose}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex flex-col h-full pt-16 md:pt-20">
            {/* Role indicator */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userRole?.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Admin Panel
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                      ${
                        active
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        mr-3 h-5 w-5 transition-colors
                        ${
                          active 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        }
                      `} 
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <div className="ml-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>NYSC Admin Panel</p>
                <p className="mt-1">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      {/* Desktop sidebar (always visible) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Role indicator */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 mt-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userRole?.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                    ${
                      active
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    className={`
                      mr-3 h-5 w-5 transition-colors
                      ${
                        active 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }
                    `} 
                  />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <div className="ml-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>NYSC Admin Panel</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;