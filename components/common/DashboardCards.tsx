'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MapPin,
  GraduationCap,
  Building,
  CreditCard,
  DollarSign,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className = ''
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StudentDashboardCardsProps {
  studentData?: any;
}

export const StudentDashboardCards: React.FC<StudentDashboardCardsProps> = ({ studentData }) => {
  const updateProgress = studentData?.updateProgress || 0;
  const completedSteps = Math.floor((updateProgress / 100) * 8);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Update Progress"
        value={`${updateProgress}%`}
        description={`${completedSteps}/8 steps completed`}
        icon={<CheckCircle className="h-4 w-4" />}
      />
      
      <DashboardCard
        title="Service Year Status"
        value={studentData?.serviceStatus || 'Not Started'}
        description="Current phase of service"
        icon={<Calendar className="h-4 w-4" />}
      />
      
      <DashboardCard
        title="Deployment State"
        value={studentData?.deploymentState || 'Pending'}
        description="Assigned service location"
        icon={<MapPin className="h-4 w-4" />}
      />
      
      <DashboardCard
        title="Documents"
        value={studentData?.documentsCount || 0}
        description="Uploaded documents"
        icon={<FileText className="h-4 w-4" />}
      />
    </div>
  );
};

interface AdminDashboardCardsProps {
  adminData?: any;
}

export const AdminDashboardCards: React.FC<AdminDashboardCardsProps> = ({ adminData }) => {
  if (!adminData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-32 rounded-xl shadow-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate payment success rate
  const totalPayments = (adminData?.completedPayments || 0) + (adminData?.pendingPayments || 0);
  const successRate = totalPayments > 0 ? Math.round((adminData?.completedPayments || 0) / totalPayments * 100) : 0;
  const totalRevenue = adminData?.paymentAnalytics?.totalRevenue || 0;
  
  const primaryCards = [
    {
      title: "Total Students",
      value: adminData?.totalStudents || 0,
      description: "Active registered students",
      icon: <Users className="h-7 w-7" />,
      trend: { value: 12, isPositive: true, label: "vs last month" },
      gradient: "from-blue-500 to-blue-600",
      shadowColor: "shadow-blue-100"
    },
    {
      title: "Payment Overview",
      value: `₦${totalRevenue.toLocaleString()}`,
      description: "Total revenue collected",
      icon: <DollarSign className="h-7 w-7" />,
      trend: { value: 18, isPositive: true, label: "vs last month" },
      gradient: "from-emerald-500 to-emerald-600",
      shadowColor: "shadow-emerald-100"
    },
    {
      title: "Completed Submissions",
      value: adminData?.totalNyscSubmissions || 0,
      description: "Successfully processed",
      icon: <CheckCircle className="h-7 w-7" />,
      trend: { value: 15, isPositive: true, label: "vs last month" },
      gradient: "from-purple-500 to-purple-600",
      shadowColor: "shadow-purple-100"
    },
    {
      title: "Pending Reviews",
      value: adminData?.totalTempSubmissions || 0,
      description: "Awaiting admin review",
      icon: <Clock className="h-7 w-7" />,
      trend: { value: 5, isPositive: false, label: "vs last month" },
      gradient: "from-orange-500 to-orange-600",
      shadowColor: "shadow-orange-100"
    }
  ];

  const secondaryCards = [
    {
      title: "Payment Success Rate",
      value: `${successRate}%`,
      description: "Completion rate",
      icon: <TrendingUp className="h-6 w-6" />,
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
      borderColor: "border-teal-200"
    },
    {
      title: "Pending Payments",
      value: adminData?.pendingPayments || 0,
      description: "Awaiting payment",
      icon: <CreditCard className="h-6 w-6" />,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200"
    },
    {
      title: "Confirmed Data",
      value: adminData?.confirmedData || 0,
      description: "Approved submissions",
      icon: <FileText className="h-6 w-6" />,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200"
    },
    {
      title: "System Status",
      value: "Online",
      description: "All services running",
      icon: <CheckCircle className="h-6 w-6" />,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryCards.map((card, index) => (
          <div key={index} className="group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-lg ${card.shadowColor} hover:shadow-xl transition-all duration-300 hover:scale-105`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  {card.icon}
                </div>
                {card.trend && (
                  <div className="text-right">
                    <div className={`flex items-center text-sm font-medium ${
                      card.trend.isPositive ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {card.trend.isPositive ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {card.trend.value}%
                    </div>
                    <p className="text-xs text-white text-opacity-80 mt-1">{card.trend.label}</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white text-opacity-90 mb-2">{card.title}</h3>
                <p className="text-3xl font-bold mb-1">{card.value}</p>
                <p className="text-sm text-white text-opacity-80">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((card, index) => (
          <div key={index} className="group">
            <div className={`${card.bgColor} rounded-xl border-2 ${card.borderColor} p-4 hover:shadow-md transition-all duration-200 hover:border-opacity-60`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                  <div className={card.iconColor}>
                    {card.icon}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">{card.title}</h3>
                <p className="text-xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ProgressCardProps {
  title: string;
  description: string;
  progress: number;
  steps: { label: string; completed: boolean }[];
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  description,
  progress,
  steps
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
        
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                step.completed ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={`text-sm ${
                step.completed ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {step.completed && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Complete
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;