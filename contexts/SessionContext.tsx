'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin.service';
import { NyscSession } from '@/types/admin.types';

interface SessionContextType {
  sessions: NyscSession[];
  selectedSession: NyscSession | null;
  isLoading: boolean;
  selectSession: (sessionId: number) => void;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<NyscSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<NyscSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSessions();
      if (data.success) {
        setSessions(data.sessions);
        
        // Try to recover selected session from localStorage
        const storedId = localStorage.getItem('admin_selected_session_id');
        if (storedId) {
          const session = data.sessions.find((s: NyscSession) => s.id === Number(storedId));
          if (session) {
            setSelectedSession(session);
          } else {
            // If stored session no longer exists, but there's an active one, fall back to active
            const activeSession = data.sessions.find((s: NyscSession) => s.id === data.active_session_id);
            if (activeSession) {
               // We don't auto-select unless explicitly told, but for UX we might
               // setSelectedSession(activeSession);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const selectSession = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      localStorage.setItem('admin_selected_session_id', sessionId.toString());
      // Optional: Refresh page or trigger global data refresh
      // window.location.reload(); 
    }
  };

  return (
    <SessionContext.Provider value={{ sessions, selectedSession, isLoading, selectSession, refreshSessions }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
