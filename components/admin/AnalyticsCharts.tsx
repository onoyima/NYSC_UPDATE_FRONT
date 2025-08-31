'use client';

import React, { useState } from 'react';
import { AdminDashboardStats } from '@/types/admin.types';
import { 
  ChartBarIcon,
  UserGroupIcon,
  CreditCardIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface AnalyticsChartsProps {
  data: AdminDashboardStats;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'gender' | 'payments' | 'trends'>('departments');

  const tabs = [
    { id: 'departments', name: 'Departments', icon: AcademicCapIcon },
    { id: 'gender', name: 'Gender', icon: UserGroupIcon },
    { id: 'payments', name: 'Payments', icon: CreditCardIcon },
    { id: 'trends', name: 'Trends', icon: ChartBarIcon },
  ];

  const DepartmentChart = () => {
    const maxCount = Math.max(...data.departmentBreakdown.map(d => d.count));
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Students by Department
        </h3>
        <div className="space-y-3">
          {data.departmentBreakdown.map((dept, index) => (
            <div key={dept.department} className="flex items-center space-x-4">
              <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {dept.department}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${(dept.count / maxCount) * 100}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <div className="w-16 text-sm font-semibold text-gray-900 dark:text-white text-right">
                {dept.count}
              </div>
              <div className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right">
                {dept.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const GenderChart = () => {
    const total = data.genderBreakdown.reduce((sum, g) => sum + g.count, 0);
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Gender Distribution
        </h3>
        <div className="flex items-center justify-center space-x-8">
          {data.genderBreakdown.map((gender, index) => {
            const circumference = 2 * Math.PI * 45;
            const strokeDasharray = `${(gender.percentage / 100) * circumference} ${circumference}`;
            
            return (
              <div key={gender.gender} className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke={index === 0 ? '#3B82F6' : '#EC4899'}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={strokeDasharray}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                      style={{ animationDelay: `${index * 200}ms` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {gender.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                    index === 0 ? 'bg-blue-500' : 'bg-pink-500'
                  }`} />
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {gender.gender}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {gender.count.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const PaymentChart = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Analytics
        </h3>
        
        {/* Payment metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₦{(data.paymentAnalytics.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₦{data.paymentAnalytics.averageAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Amount</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.paymentAnalytics.successRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
        </div>

        {/* Monthly trends */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Monthly Revenue Trends
          </h4>
          <div className="space-y-2">
            {data.paymentAnalytics.monthlyTrends.map((trend, index) => {
              const maxRevenue = Math.max(...data.paymentAnalytics.monthlyTrends.map(t => t.revenue));
              const widthPercentage = (trend.revenue / maxRevenue) * 100;
              
              return (
                <div key={trend.month} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {trend.month}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${widthPercentage}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  <div className="w-20 text-sm font-semibold text-gray-900 dark:text-white text-right">
                    ₦{(trend.revenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="w-16 text-xs text-gray-500 dark:text-gray-400 text-right">
                    {trend.count} payments
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const TrendsChart = () => {
    const trendData = [
      { label: 'Update Rate', value: 85, change: '+12%', color: 'blue' },
      { label: 'Payment Completion', value: 78, change: '+8%', color: 'green' },
      { label: 'Data Verification', value: 92, change: '+5%', color: 'purple' },
      { label: 'Submission Rate', value: 88, change: '+15%', color: 'indigo' },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Trends
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trendData.map((trend, index) => (
            <div key={trend.label} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  {trend.label}
                </h4>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {trend.change}
                </span>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {trend.value}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                      trend.color === 'blue' ? 'bg-blue-500' :
                      trend.color === 'green' ? 'bg-green-500' :
                      trend.color === 'purple' ? 'bg-purple-500' :
                      'bg-indigo-500'
                    }`}
                    style={{ 
                      width: `${trend.value}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentChart />;
      case 'gender':
        return <GenderChart />;
      case 'payments':
        return <PaymentChart />;
      case 'trends':
        return <TrendsChart />;
      default:
        return <DepartmentChart />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Tab navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Chart content */}
      <div className="animate-fade-in">
        {renderChart()}
      </div>
    </div>
  );
};

export default AnalyticsCharts;