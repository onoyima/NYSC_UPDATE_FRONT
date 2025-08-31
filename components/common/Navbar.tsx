'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Moon, Sun, Monitor, LogOut, User, Settings, Bell, Search, Menu } from 'lucide-react';
import { getInitials } from '@/utils/formatters';

interface NavbarProps {
  userType?: 'student' | 'admin';
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  userType: propUserType, 
  onSidebarToggle,
  isSidebarCollapsed = false 
}) => {
  const { user, userType: authUserType, logout } = useAuth();
  const userType = propUserType || authUserType;
  const { theme, setTheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 ml-0 md:ml-64">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSidebar}
            className="md:hidden h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {/* Desktop Sidebar Toggle */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="h-9 w-9 p-0"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}
          
          {/* Logo */}
          <Link 
            href={userType === 'admin' ? '/admin' : '/student'} 
            className="flex items-center gap-2 font-bold text-lg"
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="hidden sm:inline-block">Student Portal</span>
          </Link>
        </div>

        {/* Center Section - Search (optional) */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-sm">
            {/* Search can be added here later */}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    {(user as any).passport && (
                      <AvatarImage 
                        src={`data:image/jpeg;base64,${(user as any).passport}`} 
                        alt="User passport"
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="text-sm">
                      {getInitials((user as any).name || `${(user as any).firstName} ${(user as any).surname}`)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(user as any).name || `${(user as any).firstName} ${(user as any).surname}`}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userType === 'student' ? (user as any).matric_no || (user as any).stateCode : (user as any).email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {userType === 'admin' ? 'Administrator' : 'Student'}
                      </Badge>
                      {userType === 'student' && (user as any).matric_no && (
                        <Badge variant="outline" className="text-xs">
                          {(user as any).matric_no}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;