'use client';

import React from 'react';
import { 
  UsersIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { AdminDashboardStats } from '@/types/admin.types';

interface DashboardStatsProps {
  data: AdminDashboardStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white',
    indigo: 'bg-indigo-500 text-white',
  };

  const bgColorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                change.type === 'increase' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColorClasses[color as keyof typeof bgColorClasses]}`}>
          <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  const stats = [
    {
      title: 'Total Students',
      value: data.totalStudents,
      icon: UsersIcon,
      color: 'blue',
      change: { value: 12, type: 'increase' as const },
      subtitle: 'Updated students'
    },
    {
      title: 'Confirmed Data',
      value: data.confirmedData,
      icon: CheckCircleIcon,
      color: 'green',
      change: { value: 8, type: 'increase' as const },
      subtitle: `${((data.confirmedData / data.totalStudents) * 100).toFixed(1)}% completion rate`
    },
    {
      title: 'Completed Payments',
      value: data.completedPayments,
      icon: CreditCardIcon,
      color: 'purple',
      change: { value: 15, type: 'increase' as const },
      subtitle: `₦${(data.completedPayments * 50000).toLocaleString()} total revenue`
    },
    {
      title: 'Pending Payments',
      value: data.pendingPayments,
      icon: ClockIcon,
      color: 'yellow',
      change: { value: 5, type: 'decrease' as const },
      subtitle: 'Awaiting payment'
    },
    {
      title: 'NYSC Submissions',
      value: data.totalNyscSubmissions,
      icon: DocumentTextIcon,
      color: 'indigo',
      change: { value: 10, type: 'increase' as const },
      subtitle: 'Completed submissions'
    },
    {
      title: 'Temp Submissions',
      value: data.totalTempSubmissions,
      icon: ClipboardDocumentListIcon,
      color: 'red',
      change: { value: 3, type: 'increase' as const },
      subtitle: 'Pending review'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Overview Statistics
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Quick insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {((data.completedPayments / data.totalStudents) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payment Success Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {((data.confirmedData / data.totalStudents) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Data Completion Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ₦{((data.completedPayments * 50000) / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Revenue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;