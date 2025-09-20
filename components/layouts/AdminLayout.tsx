'use client';

import React from 'react';
import Sidebar from '@/components/common/Sidebar';
import Navbar from '@/components/common/Navbar';
import ProtectedRoute from '@/components/common/ProtectedRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <ProtectedRoute userType="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Navbar */}
        <Navbar userType="admin" />
        
        {/* Main Content */}
        <main className="ml-0 md:ml-64 overflow-y-auto h-screen pt-20 p-4 lg:p-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;