'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { AuthContextType, Student, AdminUser, LoginCredentials, UserType, AdminRole, RolePermissions } from '@/types/auth.types';
import { getUserRole, getRolePermissions, hasPermission } from '@/utils/rolePermissions';
import authService from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthState {
  user: Student | AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  userRole?: AdminRole;
  userPermissions?: RolePermissions;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: Student | AdminUser; userType: UserType; userRole?: AdminRole; userPermissions?: RolePermissions } }
  | { type: 'CLEAR_USER' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        userType: action.payload.userType,
        userRole: action.payload.userRole,
        userPermissions: action.payload.userPermissions,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_USER':
      return {
        user: null,
        userType: null,
        userRole: undefined,
        userPermissions: undefined,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    userType: null,
    userRole: undefined,
    userPermissions: undefined,
  });

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    localStorage.setItem('nysc_last_activity', Date.now().toString());
  }, []);

  // Check if session has expired
  const checkSessionExpiry = useCallback(() => {
    const lastActivity = localStorage.getItem('nysc_last_activity');
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceLastActivity > IDLE_TIMEOUT) {
        toast.info('Session expired due to inactivity');
        logout();
        return true;
      }
    }
    return false;
  }, []);

  // Start session monitoring
  const startSessionMonitoring = useCallback(() => {
    clearTimers();
    updateLastActivity();

    // Set up idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      toast.info('Session expired due to inactivity');
      logout();
    }, IDLE_TIMEOUT);

    // Set up periodic activity check
    activityTimeoutRef.current = setTimeout(() => {
      if (!checkSessionExpiry()) {
        startSessionMonitoring(); // Restart monitoring if session is still valid
      }
    }, ACTIVITY_CHECK_INTERVAL);
  }, [clearTimers, updateLastActivity, checkSessionExpiry, IDLE_TIMEOUT]);

  // Handle user activity
  const handleUserActivity = useCallback(() => {
    if (state.isAuthenticated) {
      updateLastActivity();
      startSessionMonitoring();
    }
  }, [state.isAuthenticated, updateLastActivity, startSessionMonitoring]);

  // Set up activity listeners
  useEffect(() => {
    if (state.isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
      };
    }
  }, [state.isAuthenticated, handleUserActivity]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token, user, userType } = authService.getStoredAuthData();
        
        if (token && user && userType) {
          // Check if session has expired
          if (checkSessionExpiry()) {
            return;
          }

          // Get role and permissions for admin users
          let userRole: AdminRole | undefined;
          let userPermissions: RolePermissions | undefined;
          
          if (userType === 'admin' && user) {
            const adminUser = user as AdminUser;
            userRole = getUserRole(adminUser.id); // Using id as staff_id for now
            userPermissions = getRolePermissions(userRole);
          }
          
          // Set user from stored data first to avoid login redirect
          dispatch({ 
            type: 'SET_USER', 
            payload: { 
              user, 
              userType,
              userRole,
              userPermissions
            } 
          });
          
          // Start session monitoring
          startSessionMonitoring();
          
          // Verify token with backend in background
          try {
            await authService.verifyToken(true);
          } catch (verifyError: any) {
            // Only logout if it's an authentication error (401)
            if (verifyError?.response?.status === 401) {
              setTimeout(() => {
                logout();
              }, 100);
            }
            // For other errors (network, 500, etc.), keep user logged in with stored data
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        // Token is invalid, clear stored data
        authService.logout();
        dispatch({ type: 'CLEAR_USER' });
      }
    };

    initializeAuth();
  }, [checkSessionExpiry, startSessionMonitoring]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authService.login(credentials);

      // Get role and permissions for admin users
      let userRole: AdminRole | undefined;
      let userPermissions: RolePermissions | undefined;
      
      if (response.userType === 'admin') {
        const adminUser = response.user as AdminUser;
        userRole = getUserRole(adminUser.id); // Using id as staff_id for now
        userPermissions = getRolePermissions(userRole);
      }

      authService.storeAuthData(response.token, response.user, response.userType);
      dispatch({ 
        type: 'SET_USER', 
        payload: { 
          user: response.user, 
          userType: response.userType,
          userRole,
          userPermissions
        } 
      });
      
      // Start session monitoring after successful login
      startSessionMonitoring();
      
      toast.success(response.message || 'Login successful');
      return response;
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear timers and session data
      clearTimers();
      localStorage.removeItem('nysc_last_activity');
      
      await authService.logout();
      dispatch({ type: 'CLEAR_USER' });
      toast.success('Logged out successfully');
    } catch (error) {
      // Handle logout error
      clearTimers();
      localStorage.removeItem('nysc_last_activity');
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  // Permission check function
  const checkPermission = useCallback((permission: keyof RolePermissions): boolean => {
    if (!state.userPermissions || state.userType !== 'admin') {
      return false;
    }
    return state.userPermissions[permission];
  }, [state.userPermissions, state.userType]);

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    userType: state.userType,
    userRole: state.userRole,
    userPermissions: state.userPermissions,
    login,
    logout,
    hasPermission: checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};