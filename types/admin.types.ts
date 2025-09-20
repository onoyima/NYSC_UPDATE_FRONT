import { Student } from './auth.types';

export interface AdminDashboardStats {
  totalStudents: number;
  confirmedData: number;
  completedPayments: number;
  pendingPayments: number;
  recentUpdates: Student[];
  totalNyscSubmissions: number;
  totalTempSubmissions: number;
  departmentBreakdown: DepartmentStats[];
  genderBreakdown: GenderStats[];
  paymentAnalytics: PaymentAnalytics;
}

export interface DepartmentStats {
  department: string;
  count: number;
  percentage: number;
}

export interface GenderStats {
  gender: string;
  count: number;
  percentage: number;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  averageAmount: number;
  successRate: number;
  monthlyTrends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  count: number;
}

export type AdminRole = 'super_admin' | 'admin' | 'sub_admin' | 'manager';

export interface RolePermissions {
  canViewStudentNysc: boolean;
  canEditStudentNysc: boolean;
  canAddStudentNysc: boolean;
  canDeleteStudentNysc: boolean;
  canViewPayments: boolean;
  canEditPayments: boolean;
  canViewTempSubmissions: boolean;
  canEditTempSubmissions: boolean;
  canDownloadData: boolean;
  canAssignRoles: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
}

export interface AdminUserWithRole {
  id: number;
  staff_id: number;
  name: string;
  fname?: string;
  lname?: string;
  email: string;
  department?: string;
  role: AdminRole;
  permissions: RolePermissions;
  assignedBy?: number;
  assignedAt?: string;
  isActive: boolean;
}

export interface SystemControl {
  isOpen: boolean;
  message?: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface PaymentRecord {
  id: number;
  student_id: number;
  student_name: string;
  matric_number: string;
  email: string;
  department: string;
  amount: number;
  payment_method: 'paystack' | 'bank_transfer' | 'cash';
  payment_status: 'pending' | 'successful' | 'failed' | 'refunded';
  transaction_reference: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

// Interface for duplicate payment data
export interface DuplicatePaymentData {
  student_id: number;
  student_name: string;
  matric_number: string;
  email: string;
  department: string;
  payments: {
    id: number;
    amount: number;
    payment_method: 'paystack' | 'bank_transfer' | 'cash';
    payment_status: 'successful';
    transaction_reference: string;
    payment_date: string;
  }[];
  total_paid: number;
  expected_amount: number;
  overpayment: number;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filters?: {
    department?: string;
    gender?: string;
    state?: string;
    paymentStatus?: string;
    graduationYear?: number;
    matricNumber?: string;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}

export interface StudentNyscRecord {
  id: number;
  student_id: number;
  fname?: string;
  lname?: string;
  mname?: string;
  gender?: string;
  dob?: string;
  marital_status?: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  lga?: string;
  matric_no?: string;
  course_of_study?: string;
  department?: string;
  graduation_year?: number;
  cgpa?: number;
  jamb_no?: string;
  study_mode?: string;
  is_paid?: boolean;
  payment_amount?: number;
  is_submitted?: boolean;
  payment_reference?: string;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NyscTempSubmission {
  id: number;
  student_id: number;
  form_data: any;
  submission_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NyscPaymentDetails {
  id: number;
  student_id: number;
  amount: number;
  reference: string;
  status: 'pending' | 'successful' | 'failed';
  gateway: string;
  gateway_response?: any;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  student?: {
    fname?: string;
    lname?: string;
    matric_no?: string;
    department?: string;
    email?: string;
  };
}