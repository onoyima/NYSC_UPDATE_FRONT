'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon,
  CreditCardIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: 'update' | 'payment' | 'submission' | 'verification' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    matric?: string;
  };
  status?: 'success' | 'pending' | 'failed';
  amount?: number;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'update' | 'payment' | 'submission'>('all');

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'update',
        title: 'New Student Update',
        description: 'Student completed NYSC update form',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: { name: 'John Doe', matric: 'CSC/2019/001' },
        status: 'success'
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        description: 'NYSC update fee payment completed',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: { name: 'Jane Smith', matric: 'ENG/2019/045' },
        status: 'success',
        amount: 50000
      },
      {
        id: '3',
        type: 'submission',
        title: 'Form Submission',
        description: 'Student submitted NYSC application form',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: { name: 'Mike Johnson', matric: 'MED/2019/123' },
        status: 'pending'
      },
      {
        id: '4',
        type: 'verification',
        title: 'Data Verification',
        description: 'Student data verified and approved',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        user: { name: 'Sarah Wilson', matric: 'LAW/2019/078' },
        status: 'success'
      },
      {
        id: '5',
        type: 'payment',
        title: 'Payment Failed',
        description: 'Payment transaction failed - insufficient funds',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: { name: 'David Brown', matric: 'BUS/2019/234' },
        status: 'failed',
        amount: 50000
      },
      {
        id: '6',
        type: 'alert',
        title: 'System Alert',
        description: 'Multiple failed login attempts detected',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: '7',
        type: 'update',
        title: 'Bulk Update',
        description: '15 students completed update in the last hour',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '8',
        type: 'submission',
        title: 'Temp Submission Review',
        description: 'Temporary submission requires admin review',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        user: { name: 'Lisa Anderson', matric: 'ART/2019/156' },
        status: 'pending'
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'update':
        return UserPlusIcon;
      case 'payment':
        return CreditCardIcon;
      case 'submission':
        return DocumentCheckIcon;
      case 'verification':
        return CheckCircleIcon;
      case 'alert':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (type: Activity['type'], status?: Activity['status']) => {
    if (status === 'failed') return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (status === 'pending') return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    
    switch (type) {
      case 'update':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'payment':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'submission':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'verification':
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'alert':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusBadge = (status?: Activity['status']) => {
    if (!status) return null;
    
    const statusConfig = {
      success: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Success' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', text: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Failed' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'update', label: 'Updates' },
    { value: 'payment', label: 'Payments' },
    { value: 'submission', label: 'Submissions' }
  ];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {filterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Activity list */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type, activity.status);
          
          return (
            <div 
              key={activity.id} 
              className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex-shrink-0 p-2 rounded-full ${colorClasses}`}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {activity.description}
                </p>
                
                {activity.user && (
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Student: {activity.user.name}</span>
                    {activity.user.matric && (
                      <span>Matric: {activity.user.matric}</span>
                    )}
                    {activity.amount && (
                      <span>Amount: ₦{activity.amount.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No recent activities found.
          </p>
        </div>
      )}

      {/* View all button */}
      {filteredActivities.length > 0 && (
        <div className="mt-6 text-center">
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors">
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;