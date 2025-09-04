import axiosInstance from '@/utils/axios';
import { Student } from '@/types/auth.types';
import { StudentUpdateData } from '@/types/student.types';
import { adminSettingsService, SystemStatusWithSettings } from './admin-settings.service';

class StudentService {
  async getStudentDetails(): Promise<Student> {
    const response = await axiosInstance.get('/api/nysc/student/details');
    const data = response.data;
    
    // Transform the nested backend response to match frontend Student interface
    const transformedData: Student = {
      id: data.student?.id || 0,
      name: `${data.student?.fname || ''} ${data.student?.lname || ''}`.trim(),
      fname: data.student?.fname,
      lname: data.student?.lname,
      mname: data.student?.mname,
      email: data.student?.email || '',
      phone: data.student?.phone,
      gender: data.student?.gender,
      dob: data.student?.dob,
      country_id: data.student?.country,
      state_id: data.student?.state,
      lga_name: data.student?.lga,
      city: data.student?.city,
      religion: data.student?.religion,
      marital_status: data.student?.marital_status,
      address: data.student?.address,
      passport: data.student?.passport,
      matric_no: data.academic?.matric_no || '',
      department: typeof data.academic?.department === 'object' ? data.academic?.department?.name || 'Not provided' : data.academic?.department || 'Not provided',
      level: data.academic?.level?.toString(),
      session: data.academic?.academic_session_id?.toString(),
      contacts: data.contact ? [data.contact] : [],
      nysc_data: data.nysc,
      isDataConfirmed: data.is_submitted || false,
      paymentStatus: data.is_paid ? 'completed' : 'pending',
      paymentReference: data.nysc?.payment_reference,
      // Legacy compatibility fields
      firstName: data.student?.fname,
      surname: data.student?.lname,
      middleName: data.student?.mname,
      phoneNumber: data.student?.phone,
      dateOfBirth: data.student?.dob,
      state: data.student?.state_id?.toString(),
      lga: data.student?.lga,
    };
    
    return transformedData;
  }

  async getDetails() {
    const response = await axiosInstance.get('/api/nysc/student/details');
    return response;
  }

  async updateStudentData(data: StudentUpdateData): Promise<Student> {
    const response = await axiosInstance.post('/api/nysc/student/update', data);
    return response.data;
  }

  async confirmData(): Promise<Student> {
    const response = await axiosInstance.post('/api/nysc/student/confirm');
    return response.data;
  }

  async confirmDetails(data: any): Promise<any> {
    const response = await axiosInstance.post('/api/nysc/student/confirm', data);
    return response.data;
  }

  async submitData(data?: any) {
    const response = await axiosInstance.post('/api/nysc/student/submit', data || {});
    return response;
  }

  async submitDataAfterPayment(data: any) {
    const response = await axiosInstance.post('/api/nysc/student/submit', data);
    return response;
  }

  // Payment methods
  async initiatePayment() {
    // Get session_id from localStorage
    const sessionId = localStorage.getItem('nysc_session_id');
    
    const response = await axiosInstance.post('/api/nysc/payment', {
      session_id: sessionId
    });
    return response;
  }

  async verifyPayment(reference: string) {
    const response = await axiosInstance.get(`/api/nysc/payment/verify?reference=${reference}`);
    return response;
  }

  // Document methods
  // Document methods removed - feature discontinued

  // Profile methods
  async getProfile() {
    const response = await axiosInstance.get('/api/nysc/student/profile');
    return response;
  }

  async updateProfile(profileData: any) {
    const response = await axiosInstance.put('/api/nysc/student/profile', profileData);
    return response;
  }

  async getStudyModes() {
    const response = await axiosInstance.get('/api/nysc/student/study-modes');
    return response.data;
  }

  async getAnalytics() {
    const response = await axiosInstance.get('/api/nysc/student/analytics');
    return response.data;
  }

  // Payment history methods
  async getPaymentHistory() {
    const response = await axiosInstance.get('/api/nysc/payment/history');
    return response;
  }

  async getPaymentReceipt(paymentId: string) {
    const response = await axiosInstance.get(`/api/nysc/payment/receipt/${paymentId}`);
    return response;
  }

  async getUpdatedStudentInfo() {
    const response = await axiosInstance.get('/api/nysc/student/updated-info');
    return response;
  }

  // Get system status for payment information with dynamic settings
  async getSystemStatus(): Promise<SystemStatusWithSettings> {
    try {
      // Use the public system status endpoint (no authentication required)
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/';
      const response = await fetch(`${baseURL}api/nysc/system-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      const data = result.data;
      
      // Map the response to our expected format
      return {
        is_open: data.is_open,
        deadline: data.deadline,
        is_late_fee: data.is_late_fee,
        current_fee: data.current_fee,
        payment_amount: data.payment_amount,
        late_payment_fee: data.late_payment_fee,
        countdown_title: data.countdown_title,
        countdown_message: data.countdown_message,
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      throw error;
    }
  }
}

const studentService = new StudentService();
export { studentService };
export default studentService;