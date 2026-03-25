'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Activity
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const SessionsPage = () => {
  const { user, userType, hasPermission, isLoading } = useAuth();
  const router = useRouter();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // New session form state
  const [newSession, setNewSession] = useState({
    name: '',
    code: '',
    start_at: '',
    end_at: '',
    status: 'planned'
  });

  const fetchSessions = async () => {
    try {
      setIsLoadingData(true);
      const response = await adminService.getSessions();
      if (response.success) {
        setSessions(response.sessions);
        setActiveSessionId(response.active_session_id || null);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (userType !== 'admin') {
        router.push('/login');
        return;
      }

      if (!hasPermission('canManageSystem')) {
        toast.error('You do not have permission to access this page');
        router.push('/admin');
        return;
      }
      
      fetchSessions();
    }
  }, [userType, hasPermission, isLoading, router]);

  const handleCreateSession = async () => {
    try {
      if (!newSession.name || !newSession.start_at) {
        toast.error('Please fill in required fields');
        return;
      }

      await adminService.createSession(newSession);
      toast.success('Session created successfully');
      setIsCreateModalOpen(false);
      setNewSession({ name: '', code: '', start_at: '', end_at: '', status: 'planned' });
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleActivateSession = async (id: number) => {
    try {
      await adminService.activateSession(id);
      toast.success('Session activated successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error activating session:', error);
      toast.error('Failed to activate session');
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-background">
        <SidebarMain />
        <Navbar userType="admin" />
        
        <main className="ml-0 md:ml-64 pt-28 md:pt-32 pb-24 p-4 md:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Calendar className="h-8 w-8 text-primary" />
                  NYSC Sessions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage academic sessions and registration periods for NYSC mobilization.
                </p>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                      Setup a new academic session for NYSC registration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Session Name (e.g. 2024/2025 Session)</Label>
                      <Input 
                        id="name" 
                        placeholder="2024/2025 Session" 
                        value={newSession.name}
                        onChange={(e) => setNewSession({...newSession, name: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="code">Session Code (Optional, e.g. 2425)</Label>
                      <Input 
                        id="code" 
                        placeholder="2425" 
                        value={newSession.code}
                        onChange={(e) => setNewSession({...newSession, code: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start_at">Start Date</Label>
                        <Input 
                          id="start_at" 
                          type="date"
                          value={newSession.start_at}
                          onChange={(e) => setNewSession({...newSession, start_at: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end_at">End Date (Optional)</Label>
                        <Input 
                          id="end_at" 
                          type="date"
                          value={newSession.end_at}
                          onChange={(e) => setNewSession({...newSession, end_at: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Initial Status</Label>
                      <Select 
                        value={newSession.status}
                        onValueChange={(value) => setNewSession({...newSession, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateSession}>Create Session</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Active Session Card */}
            {activeSessionId && (
              <Card className="mb-8 border-primary/50 bg-primary/5 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2 h-20">
                  <div className="flex flex-col">
                    <CardTitle className="text-lg font-medium">Currently Active Session</CardTitle>
                    <CardDescription>All new registrations and payments will be tied to this session.</CardDescription>
                  </div>
                  <Activity className="h-8 w-8 text-primary animate-pulse" />
                </CardHeader>
                <CardContent className="pt-6">
                  {sessions.find(s => s.id === activeSessionId) && (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl font-bold">{sessions.find(s => s.id === activeSessionId).name}</span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started: {new Date(sessions.find(s => s.id === activeSessionId).start_at).toLocaleDateString()}
                          </span>
                          {sessions.find(s => s.id === activeSessionId).end_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Ends: {new Date(sessions.find(s => s.id === activeSessionId).end_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" className="bg-primary hover:bg-primary px-4 py-1 text-md">
                        ACTIVE
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sessions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>A list of all academic sessions and their current status.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Registration Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No sessions found. Create your first session to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow key={session.id} className={session.id === activeSessionId ? "bg-primary/5" : ""}>
                          <TableCell className="font-medium">
                            {session.name}
                            {session.id === activeSessionId && (
                              <Badge variant="outline" className="ml-2 text-[10px] uppercase font-bold text-primary border-primary">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>{session.code || '-'}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {new Date(session.start_at).toLocaleDateString()} 
                              {session.end_at ? ` - ${new Date(session.end_at).toLocaleDateString()}` : ' (Open Ended)'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.status === 'active' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" /> ACTIVE
                              </Badge>
                            ) : session.status === 'closed' ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" /> CLOSED
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                                <Clock className="h-3 w-3 mr-1" /> PLANNED
                              </Badge>
                            )
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {session.id !== activeSessionId ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8"
                                onClick={() => handleActivateSession(session.id)}
                              >
                                Activate
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Main Session</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

// Simple wrapper for Sidebar to avoid importing the wrong one
const SidebarMain = () => {
    return <Sidebar />;
};

export default SessionsPage;
