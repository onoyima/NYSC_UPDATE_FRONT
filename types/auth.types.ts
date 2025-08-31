// Import and re-export admin types
import type { AdminRole, RolePermissions } from './admin.types';
export type { AdminRole, RolePermissions };

// Role display names for UI
export const roleDisplayNames: Record<AdminRole, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  sub_admin: 'Sub Administrator',
  manager: 'Manager'
};

export interface LoginCredentials {
  identity: string; // email or matric_no
  password: string;
}

export interface StudentContact {
  id: number;
  student_id: number;
  title?: string;
  surname?: string;
  other_names?: string;
  relationship?: string;
  address?: string;
  state?: string;
  city?: string;
  phone_no?: string;
  phone_no_two?: string;
  email?: string;
  email_two?: string;
  status?: string;
}

export interface StudentMedical {
  id: number;
  student_id: number;
  physical?: string;
  blood_group?: string;
  condition?: string;
  allergies?: string;
  genotype?: string;
}

export interface StudentNysc {
  id: number;
  student_id: number;
  is_paid?: boolean;
  payment_amount?: number;
  is_submitted?: boolean;
  payment_reference?: string;
  payment_date?: string;
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
}

export interface Student {
  id: number;
  name: string;
  fname?: string;
  lname?: string;
  mname?: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  country_id?: number;
  state_id?: number;
  lga_name?: string;
  city?: string;
  religion?: string;
  marital_status?: string;
  address?: string;
  passport?: string;
  signature?: string;
  hobbies?: string;
  username?: string;
  matric_no: string;
  department?: string;
  level?: string;
  session?: string;
  status?: string;
  contacts?: StudentContact[];
  medical_info?: StudentMedical;
  nysc_data?: StudentNysc;
  // Legacy fields for backward compatibility
  stateCode?: string;
  surname?: string;
  firstName?: string;
  middleName?: string;
  dateOfBirth?: string;
  institution?: string;
  course?: string;
  degreeClass?: string;
  graduationYear?: number;
  phoneNumber?: string;
  lga?: string;
  state?: string;
  isDataConfirmed?: boolean;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentReference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffContact {
  id: number;
  staff_id: number;
  contact_type?: string;
  contact_value?: string;
  is_primary?: boolean;
}

export interface StaffMedical {
  id: number;
  staff_id: number;
  physical?: string;
  blood_group?: string;
  condition?: string;
  allergies?: string;
  genotype?: string;
}

export interface StaffWorkProfile {
  id: number;
  staff_id: number;
  // Add other work profile fields as needed
}



export interface AdminUser {
  id: number;
  name: string;
  fname?: string;
  lname?: string;
  mname?: string;
  maiden_name?: string;
  email: string;
  p_email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  title?: string;
  department?: string;
  country_id?: number;
  state_id?: number;
  lga_name?: string;
  address?: string;
  city?: string;
  religion?: string;
  marital_status?: string;
  passport?: string;
  signature?: string;
  status?: string;
  contacts?: StaffContact[];
  medical_info?: StaffMedical;
  work_profiles?: StaffWorkProfile[];

  // Legacy fields for backward compatibility
  role?: 'admin' | 'super_admin';
  permissions?: string[];
  createdAt?: string;
}

export type UserType = 'student' | 'admin';

export interface AuthResponse {
  token: string;
  userType: UserType;
  user: Student | AdminUser;
  message: string;
}

export interface AuthContextType {
  user: Student | AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType | null;
  userRole?: AdminRole;
  userPermissions?: RolePermissions;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => void;
  hasPermission: (permission: keyof RolePermissions) => boolean;
}
