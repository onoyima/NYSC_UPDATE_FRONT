'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  FileText,
  CreditCard,
  Settings,
  Users,
  BarChart3,
  Bell,
  Shield,
  Calendar,
  MessageSquare,
  HelpCircle,
  Receipt,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { hasPermission, getUserRole } from '@/utils/rolePermissions';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const studentNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/student',
    icon: Home,
  },
  {
    title: 'Confirm Data',
    href: '/student/confirm',
    icon: User,
  },
  {
    title: 'Payment',
    href: '/student/payment',
    icon: CreditCard,
  },
  {
    title: 'Payment History',
    href: '/student/payment-history',
    icon: Receipt,
  },
  {
    title: 'Updated Info',
    href: '/student/updated-info',
    icon: UserCheck,
  },
];

const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Submissions',
    href: '/admin/submissions',
    icon: FileText,
  },
  {
    title: 'Exports',
    href: '/admin/exports',
    icon: BarChart3,
  },
  {
    title: 'Admin Users',
    href: '/admin/admin-users',
    icon: UserCheck,
  },
  {
    title: 'Roles',
    href: '/admin/roles',
    icon: Shield,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { userType, user } = useAuth();
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  // Filter admin navigation items based on user permissions
  const getFilteredAdminNavItems = () => {
    if (!user?.id) return [];
    
    const userRole = getUserRole(user.id);
    return adminNavItems.filter(item => {
      switch (item.href) {
        case '/admin':
          return true; // Dashboard is always visible
        case '/admin/students':
          return hasPermission(userRole, 'canViewStudentNysc');
        case '/admin/payments':
          return hasPermission(userRole, 'canViewPayments');
        case '/admin/submissions':
          return hasPermission(userRole, 'canViewTempSubmissions');
        case '/admin/exports':
          return hasPermission(userRole, 'canDownloadData');
        case '/admin/admin-users':
          return hasPermission(userRole, 'canAssignRoles');
        case '/admin/roles':
          return hasPermission(userRole, 'canAssignRoles');
        case '/admin/settings':
          return hasPermission(userRole, 'canManageSystem');
        default:
          return true;
      }
    });
  };

  const navItems = userType === 'admin' ? getFilteredAdminNavItems() : studentNavItems;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const target = event.target as Node;
      if (sidebar && !sidebar.contains(target) && isMobileOpen) {
        closeMobileSidebar();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileOpen, closeMobileSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col border-r bg-background transition-all duration-300 z-50',
          // Desktop behavior
          'hidden md:flex',
          isCollapsed ? 'md:w-16' : 'md:w-64',
          // Mobile behavior
          isMobileOpen ? 'flex w-64' : 'hidden',
          className
        )}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobileSidebar}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <Link href={userType === 'admin' ? '/admin' : '/student'} className="flex items-center space-x-2">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={32}
              height={32}
              className="h-8 w-8 rounded object-contain"
            />
            <span className="text-lg font-semibold">Portal</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href={userType === 'admin' ? '/admin' : '/student'} className="flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={32}
              height={32}
              className="h-8 w-8 rounded object-contain"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-10',
                    isCollapsed ? 'px-2' : 'px-3',
                    isActive && 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isCollapsed ? 'mx-auto' : 'mr-3')} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <Separator className="mb-3" />
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            Student Update Portal v1.0
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Sidebar;