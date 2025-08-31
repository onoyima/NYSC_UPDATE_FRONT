import axiosInstance from '@/utils/axios';
import { AdminDashboardStats, SystemControl, PaymentRecord, ExportOptions } from '@/types/admin.types';
import { Student } from '@/types/auth.types';

class AdminService {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await axiosInstance.get('/api/nysc/admin/dashboard');
    return response.data;
  }

  async getSystemControl(): Promise<SystemControl> {
    const response = await axiosInstance.get('/api/nysc/admin/control');
    return response.data;
  }

  async updateSystemControl(isOpen: boolean, message?: string): Promise<SystemControl> {
    const response = await axiosInstance.post('/api/nysc/admin/control', { isOpen, message });
    return response.data;
  }

  async getStudents(page = 1, limit = 10, search?: string): Promise<{ students: Student[]; total: number; totalPages: number }> {
    const response = await axiosInstance.get('/api/nysc/admin/students', {
      params: { page, limit, search }
    });
    return response.data;
  }

  async getStudent(id: string): Promise<Student> {
    const response = await axiosInstance.get(`/api/nysc/admin/student/${id}`);
    return response.data;
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const response = await axiosInstance.put(`/api/nysc/admin/student/${id}`, data);
    return response.data;
  }

  async getPayments(page = 1, limit = 10): Promise<{ payments: PaymentRecord[]; total: number; totalPages: number }> {
    const response = await axiosInstance.get('/api/nysc/admin/payments', {
      params: { page, limit }
    });
    return response.data;
  }

  async exportData(options: ExportOptions): Promise<Blob> {
    const response = await axiosInstance.get(`/api/nysc/admin/exports/${options.format}`, {
      params: options.filters,
      responseType: 'blob'
    });
    return response.data;
  }

  // Export jobs management
  async createExportJob(jobData: any) {
    const response = await axiosInstance.post('/api/nysc/admin/export-jobs', jobData);
    return response.data;
  }

  async getExportJobs(page: number = 1, limit: number = 10) {
    const response = await axiosInstance.get(`/api/nysc/admin/export-jobs?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getExportJobStatus(jobId: string) {
    const response = await axiosInstance.get(`/api/nysc/admin/export-jobs/${jobId}`);
    return response.data;
  }

  async downloadExportFile(jobId: string) {
    const response = await axiosInstance.get(`/api/nysc/admin/export-jobs/${jobId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Student management methods
  async getAllStudents() {
    const response = await axiosInstance.get('/api/nysc/admin/students/all');
    return response;
  }

  async getStudentStats() {
    const response = await axiosInstance.get('/api/nysc/admin/students/stats');
    return response;
  }

  async getStudentDetails(studentId: string) {
    const response = await axiosInstance.get(`/api/nysc/admin/students/${studentId}`);
    return response;
  }

  async exportStudents() {
    const response = await axiosInstance.get('/api/nysc/admin/students/export', {
      responseType: 'blob'
    });
    return response;
  }

  // System settings methods
  async getSystemSettings() {
    const response = await axiosInstance.get('/api/nysc/admin/settings/system');
    return response;
  }

  async updateSystemSettings(settings: any) {
    const response = await axiosInstance.put('/api/nysc/admin/settings/system', settings);
    return response;
  }

  async getEmailSettings() {
    const response = await axiosInstance.get('/api/nysc/admin/settings/email');
    return response;
  }

  async updateEmailSettings(settings: any) {
    const response = await axiosInstance.put('/api/nysc/admin/settings/email', settings);
    return response;
  }

  async testEmailSettings() {
    const response = await axiosInstance.post('/api/nysc/admin/settings/email/test');
    return response;
  }

  // Cache management
  async clearCache() {
    const response = await axiosInstance.post('/api/nysc/admin/cache/clear');
    return response;
  }

  // Submissions management methods
  async getSubmissions(page: number = 1, limit: number = 10) {
    const response = await axiosInstance.get(`/api/nysc/admin/submissions?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getSubmissionDetails(submissionId: string) {
    const response = await axiosInstance.get(`/api/nysc/admin/submissions/${submissionId}`);
    return response.data;
  }

  async updateSubmissionStatus(submissionId: string, status: string, notes?: string) {
    const response = await axiosInstance.put(`/api/nysc/admin/submissions/${submissionId}/status`, {
      status,
      notes
    });
    return response.data;
  }

  // Additional admin endpoints
  async testEmail() {
    const response = await axiosInstance.post('/api/nysc/admin/test-email');
    return response;
  }

  async getControl() {
    const response = await axiosInstance.get('/api/nysc/admin/control');
    return response;
  }

  // Admin user management methods
  async getAdminUsers(search?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await axiosInstance.get(`/api/nysc/admin/admin-users?${params.toString()}`);
    return response.data;
  }

  async createAdminUser(userData: {
    fname: string;
    lname: string;
    email: string;
    password: string;
    role: string;
    status: string;
  }) {
    const response = await axiosInstance.post('/api/nysc/admin/admin-users', userData);
    return response.data;
  }

  async updateAdminUser(userId: number, userData: {
    fname?: string;
    lname?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: string;
  }) {
    const response = await axiosInstance.put(`/api/nysc/admin/admin-users/${userId}`, userData);
    return response.data;
  }

  async updateAdminProfile(profileData: {
    fname?: string;
    lname?: string;
    email?: string;
    phone?: string;
    address?: string;
    department?: string;
  }) {
    const response = await axiosInstance.put('/api/nysc/admin/profile', profileData);
    return response.data;
  }

  async deleteAdminUser(userId: number) {
    const response = await axiosInstance.delete(`/api/nysc/admin/admin-users/${userId}`);
    return response.data;
  }

  // Upload CSV file for bulk student import
  async uploadCsv(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('csv_file', file);
    
    const response = await axiosInstance.post('/api/nysc/admin/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Download CSV template
  async downloadCsvTemplate(): Promise<Blob> {
    const response = await axiosInstance.get('/api/nysc/admin/csv-template', {
      responseType: 'blob',
    });
    return response.data;
  }


}

const adminService = new AdminService();
export { adminService };
export default adminService;