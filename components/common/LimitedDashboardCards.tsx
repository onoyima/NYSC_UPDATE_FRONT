'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Download,
  BarChart3
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

interface LimitedDashboardCardsProps {
  adminData?: any;
  userRole: 'sub_admin' | 'manager';
}

export const LimitedDashboardCards: React.FC<LimitedDashboardCardsProps> = ({ adminData, userRole }) => {
  // For sub_admin: show basic stats with limited editing capabilities
  // For manager: show view-only stats focused on monitoring
  
  const isManager = userRole === 'manager';
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Students"
        value={adminData?.totalStudents || 0}
        description={isManager ? "Updated students (view only)" : "Updated students"}
        icon={<Users className="h-4 w-4" />}
        trend={{ value: 12, isPositive: true }}
      />
      
      <DashboardCard
        title="Pending Reviews"
        value={adminData?.totalTempSubmissions || 0}
        description={isManager ? "Awaiting review (view only)" : "Awaiting your review"}
        icon={<Clock className="h-4 w-4" />}
        trend={{ value: 5, isPositive: false }}
      />
      
      <DashboardCard
        title="Completed Submissions"
        value={adminData?.confirmedData || 0}
        description="Successfully processed"
        icon={<CheckCircle className="h-4 w-4" />}
        trend={{ value: 8, isPositive: true }}
      />
      
      <DashboardCard
        title={isManager ? "Payment Overview" : "Payment Status"}
        value={adminData?.completedPayments || 0}
        description={isManager ? "Successful payments (view only)" : "Payments completed"}
        icon={<BarChart3 className="h-4 w-4" />}
        trend={{ value: 3, isPositive: true }}
      />
    </div>
  );
};

export default LimitedDashboardCards;