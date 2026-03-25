'use client';

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SessionGateProps {
  children: React.ReactNode;
}

const SessionGate: React.FC<SessionGateProps> = ({ children }) => {
  const { sessions, selectedSession, selectSession, isLoading } = useSession();
  const { userType } = useAuth();
  const [selectedId, setSelectedId] = useState<string>('');

  // Only apply to admin users
  if (userType !== 'admin') {
    return <>{children}</>;
  }

  // If still loading sessions, show nothing or a loader
  if (isLoading && !selectedSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If a session is already selected, just show the content
  if (selectedSession) {
    return <>{children}</>;
  }

  const handleConfirm = () => {
    if (selectedId) {
      selectSession(Number(selectedId));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
       <Dialog open={true}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader className="space-y-3 pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900">
              Mandatory Session Selection
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-base">
              To ensure data integrity, please select an active NYSC session before proceeding to the administrative dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Select Academic Session
              </label>
              <Select onValueChange={setSelectedId} value={selectedId}>
                <SelectTrigger className="w-full h-12 border-gray-200 focus:ring-primary/20 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Choose a session..." />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {sessions.length === 0 ? (
                    <SelectItem value="none" disabled>No sessions available</SelectItem>
                  ) : (
                    sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()} className="py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{session.name}</span>
                          {session.is_active && (
                            <span className="text-xs text-green-600 font-semibold uppercase tracking-wider mt-0.5">
                              ● Currently Active
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {sessions.length === 0 && (
               <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    No sessions found in the system. Please contact the super administrator to initialize a new NYSC session.
                  </p>
               </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedId}
              className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Access Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionGate;
