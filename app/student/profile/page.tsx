'use client';

import React from 'react';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ProfileSection from '@/components/common/ProfileSection';

const StudentProfilePage: React.FC = () => {
  return (
    <ProtectedRoute userType="student">
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-muted-foreground mt-2">
                  View and manage your personal information
                </p>
              </div>
              
              <ProfileSection userType="student" />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudentProfilePage;