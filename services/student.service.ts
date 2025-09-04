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
      return await adminSettingsService.getSystemStatusWithSettings();
    } catch (error) {
      console.error('Error fetching system status with settings:', error);
      // Fallback to basic system status
      const response = await axiosInstance.get('/api/nysc/admin/dashboard');
      return {
        is_open: response.data.system_status?.is_open || false,
        deadline: response.data.system_status?.deadline || '2026-12-31',
        is_late_fee: response.data.system_status?.is_late_fee || false,
        current_fee: response.data.system_status?.current_fee || 0,
      payment_amount: response.data.system_status?.payment_amount || 0,
      late_payment_fee: response.data.system_status?.late_payment_fee || 0,
        countdown_title: 'Payment Deadline',
        countdown_message: 'Complete your payment before the deadline'
      };
    }
  }
}

const studentService = new StudentService();
export { studentService };
export default studentService;