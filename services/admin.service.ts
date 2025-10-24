import axiosInstance from "@/utils/axios";
import {
  AdminDashboardStats,
  SystemControl,
  PaymentRecord,
  ExportOptions,
  DuplicatePaymentData,
} from "@/types/admin.types";
import { Student } from "@/types/auth.types";

class AdminService {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await axiosInstance.get("/api/nysc/admin/dashboard");
    return response.data;
  }

  async getSystemControl(): Promise<SystemControl> {
    const response = await axiosInstance.get("/api/nysc/admin/control");
    return response.data;
  }

  async updateSystemControl(
    isOpen: boolean,
    message?: string
  ): Promise<SystemControl> {
    const response = await axiosInstance.post("/api/nysc/admin/control", {
      isOpen,
      message,
    });
    return response.data;
  }

  async getStudents(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{ students: Student[]; total: number; totalPages: number }> {
    const response = await axiosInstance.get("/api/nysc/admin/students", {
      params: { page, limit, search },
    });
    return response.data;
  }

  async getStudent(id: string): Promise<Student> {
    const response = await axiosInstance.get(`/api/nysc/admin/student/${id}`);
    return response.data;
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const response = await axiosInstance.put(
      `/api/nysc/admin/student/${id}`,
      data
    );
    return response.data;
  }

  async getPayments(
    page = 1,
    limit = 10,
    filters?: {
      status?: string;
      method?: string;
      search?: string;
      dateStart?: string;
      dateEnd?: string;
    }
  ): Promise<{ payments: PaymentRecord[]; total: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get("/api/nysc/admin/payments", {
        params: { page, limit, ...filters },
      });

      // Debug the response structure
      console.log("API Response:", response.data);

      // Handle different response formats
      if (response.data && response.data.payments) {
        // Standard format
        return response.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Array format
        return {
          payments: response.data,
          total: response.data.length,
          totalPages: 1,
        };
      } else {
        // Empty or unexpected format
        console.error("Unexpected API response format:", response.data);
        return {
          payments: [],
          total: 0,
          totalPages: 1,
        };
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      return {
        payments: [],
        total: 0,
        totalPages: 1,
      };
    }
  }

  async getPendingPayments(
    page = 1,
    limit = 10
  ): Promise<{ payments: PaymentRecord[]; total: number; totalPages: number }> {
    return this.getPayments(page, limit, { status: "pending" });
  }

  async verifyPayment(paymentId: number): Promise<PaymentRecord> {
    const response = await axiosInstance.post(
      `/api/nysc/admin/payments/${paymentId}/verify`
    );
    return response.data;
  }

  async verifyAllPendingPayments(): Promise<{
    verified: number;
    failed: number;
    message: string;
  }> {
    const response = await axiosInstance.post(
      "/api/nysc/admin/payments/verify-all"
    );
    return response.data;
  }

  async getPaymentDetails(paymentId: number): Promise<PaymentRecord> {
    const response = await axiosInstance.get(
      `/api/nysc/admin/payments/${paymentId}`
    );
    return response.data;
  }

  async exportData(options: ExportOptions): Promise<Blob> {
    try {
      const response = await axiosInstance.get(
        `/api/nysc/admin/exports/${options.format}`,
        {
          params: options.filters,
          responseType: "blob",
          timeout: 60000, // 60 seconds timeout for large exports
        }
      );

      // Check if the response is actually a blob
      if (response.data instanceof Blob) {
        return response.data;
      }

      // If it's not a blob, it might be an error response
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "Export failed");
    } catch (error: any) {
      console.error("Export error:", error);

      // If it's a blob error response, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || "Export failed");
        } catch (parseError) {
          throw new Error("Export failed with unknown error");
        }
      }

      throw error;
    }
  }

  // Export jobs management
  async createExportJob(jobData: any) {
    const response = await axiosInstance.post(
      "/api/nysc/admin/export-jobs",
      jobData
    );
    return response.data;
  }

  async getExportJobs(page: number = 1, limit: number = 10) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/export-jobs?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getExportJobStatus(jobId: string) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/export-jobs/${jobId}`
    );
    return response.data;
  }

  async downloadExportFile(jobId: string) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/export-jobs/${jobId}/download`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  // Student management methods
  async getAllStudents() {
    const response = await axiosInstance.get("/api/nysc/admin/students/all");
    return response;
  }

  async getStudentStats() {
    const response = await axiosInstance.get("/api/nysc/admin/students/stats");
    return response;
  }

  async getStudentDetails(studentId: string) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/students/${studentId}`
    );
    return response;
  }

  async exportStudents() {
    const response = await axiosInstance.get(
      "/api/nysc/admin/students/export",
      {
        responseType: "blob",
      }
    );
    return response;
  }

  // Duplicate payments method
  async getDuplicatePayments(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{
    duplicate_payments: DuplicatePaymentData[];
    statistics: any;
    total: number;
    totalPages: number;
  }> {
    const response = await axiosInstance.get(
      "/api/nysc/admin/duplicate-payments",
      {
        params: { page, limit, search },
      }
    );
    return response.data;
  }

  // System settings methods
  async getSystemSettings() {
    const response = await axiosInstance.get("/api/nysc/admin/settings/system");
    return response;
  }

  async updateSystemSettings(settings: any) {
    const response = await axiosInstance.put(
      "/api/nysc/admin/settings/system",
      settings
    );
    return response;
  }

  async getEmailSettings() {
    const response = await axiosInstance.get("/api/nysc/admin/settings/email");
    return response;
  }

  async updateEmailSettings(settings: any) {
    const response = await axiosInstance.put(
      "/api/nysc/admin/settings/email",
      settings
    );
    return response;
  }

  async testEmailSettings() {
    const response = await axiosInstance.post(
      "/api/nysc/admin/settings/email/test"
    );
    return response;
  }

  // Cache management
  async clearCache() {
    const response = await axiosInstance.post(
      "/api/nysc/admin/settings/clear-cache"
    );
    return response;
  }

  // Submissions management methods
  async getSubmissions(page: number = 1, limit: number = 10) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/submissions?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getSubmissionDetails(submissionId: string) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/submissions/${submissionId}`
    );
    return response.data;
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: string,
    notes?: string
  ) {
    const response = await axiosInstance.put(
      `/api/nysc/admin/submissions/${submissionId}/status`,
      {
        status,
        notes,
      }
    );
    return response.data;
  }

  // Additional admin endpoints
  async testEmail() {
    const response = await axiosInstance.post("/api/nysc/admin/test-email");
    return response;
  }

  async getControl() {
    const response = await axiosInstance.get("/api/nysc/admin/control");
    return response;
  }

  // Admin user management methods
  async getAdminUsers(search?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const response = await axiosInstance.get(
      `/api/nysc/admin/admin-users?${params.toString()}`
    );
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
    const response = await axiosInstance.post(
      "/api/nysc/admin/admin-users",
      userData
    );
    return response.data;
  }

  async updateAdminUser(
    userId: number,
    userData: {
      fname?: string;
      lname?: string;
      email?: string;
      password?: string;
      role?: string;
      status?: string;
    }
  ) {
    const response = await axiosInstance.put(
      `/api/nysc/admin/admin-users/${userId}`,
      userData
    );
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
    const response = await axiosInstance.put(
      "/api/nysc/admin/profile",
      profileData
    );
    return response.data;
  }

  async deleteAdminUser(userId: number) {
    const response = await axiosInstance.delete(
      `/api/nysc/admin/admin-users/${userId}`
    );
    return response.data;
  }

  // Upload CSV file for bulk student import
  async uploadCsv(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("csv_file", file);

    const response = await axiosInstance.post(
      "/api/nysc/admin/upload-csv",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  // Download CSV template
  async downloadCsvTemplate(): Promise<Blob> {
    const response = await axiosInstance.get("/api/nysc/admin/csv-template", {
      responseType: "blob",
    });
    return response.data;
  }

  // Get payment details for a specific student
  async getStudentPaymentDetails(studentId: string) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/students/${studentId}`
    );
    return response.data;
  }

  // Process refund for a payment
  async processRefund(paymentId: string | number) {
    const response = await axiosInstance.post(
      `/api/nysc/admin/payments/${paymentId}/refund`
    );
    return response.data;
  }

  // Retry payment for a failed payment
  async retryPayment(paymentId: string | number) {
    const response = await axiosInstance.post(
      `/api/nysc/admin/payments/${paymentId}/retry`
    );
    return response.data;
  }

  // DOCX Import methods
  async uploadDocx(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("docx_file", file);

    const response = await axiosInstance.post(
      "/api/nysc/admin/docx-import/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async testDocxImportConnection(): Promise<any> {
    const response = await axiosInstance.get(
      "/api/nysc/admin/docx-import/test"
    );
    return response.data;
  }

  async getDocxReviewData(sessionId: string) {
    const response = await axiosInstance.get(
      `/api/nysc/admin/docx-import/review/${sessionId}`
    );
    return response.data;
  }

  async approveDocxUpdates(sessionId: string, approvals: any[]) {
    const response = await axiosInstance.post(
      "/api/nysc/admin/docx-import/approve",
      {
        session_id: sessionId,
        approvals,
      }
    );
    return response.data;
  }

  async getDocxImportStats() {
    const response = await axiosInstance.get(
      "/api/nysc/admin/docx-import/stats"
    );
    return response.data;
  }

  // Enhanced student data export
  async exportStudentNyscData(): Promise<Blob> {
    const response = await axiosInstance.get(
      "/api/nysc/admin/docx-import/export-student-data",
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  // Students list methods
  async getStudentsList(
    page = 1,
    perPage = 50,
    filters?: {
      course_study?: string;
      search?: string;
      sort_by?: string;
      sort_order?: string;
    }
  ) {
    const response = await axiosInstance.get("/api/nysc/admin/students-list", {
      params: { page, per_page: perPage, ...filters },
    });
    return response.data;
  }

  async exportStudentsList(filters?: {
    course_study?: string;
    format?: string;
  }): Promise<Blob> {
    const response = await axiosInstance.get(
      "/api/nysc/admin/students-list/export",
      {
        params: filters,
        responseType: "blob",
        timeout: 60000, // 60 seconds timeout for large exports
      }
    );
    return response.data;
  }

  // GRADUANDS processing methods (updated for new approach)
  async getGraduandsMatches(fileName?: string) {
    const params = fileName ? { file: fileName } : {};
    const response = await axiosInstance.get('/api/nysc/admin/docx-import/graduands-matches', {
      params,
      timeout: 120000 // 2 minutes timeout for DOCX processing
    });
    return response.data;
  }

  async applyGraduandsUpdates(updates: any[]) {
    const response = await axiosInstance.post('/api/nysc/admin/docx-import/graduands-apply', {
      updates
    }, {
      timeout: 60000 // 1 minute timeout for database updates
    });
    return response.data;
  }

  async getDataAnalysis() {
    const response = await axiosInstance.get('/api/nysc/admin/docx-import/data-analysis', {
      timeout: 120000 // 2 minutes timeout for comprehensive analysis
    });
    return response.data;
  }

  // CSV Export methods
  async exportStudentNyscCsv(): Promise<Blob> {
    const response = await axiosInstance.get('/api/nysc/admin/csv-export/student-data', {
      responseType: 'blob',
      timeout: 60000 // 1 minute timeout for CSV export
    });
    return response.data;
  }

  async getCsvExportStats() {
    const response = await axiosInstance.get('/api/nysc/admin/csv-export/stats', {
      timeout: 30000 // 30 seconds for stats
    });
    return response.data;
  }

  async testCsvExportApi() {
    const response = await axiosInstance.get('/api/nysc/admin/csv-export/test', {
      timeout: 10000 // 10 seconds for test
    });
    return response.data;
  }

  // Pending Payments methods
  async getPendingPaymentsStats() {
    const response = await axiosInstance.get('/api/nysc/admin/payments/pending-stats', {
      timeout: 30000 // 30 seconds timeout
    });
    return response.data;
  }

  async verifyPendingPayments(options: { force?: boolean; limit?: number } = {}) {
    const response = await axiosInstance.post('/api/nysc/admin/payments/verify-pending', options, {
      timeout: 120000 // 2 minutes timeout for verification
    });
    return response.data;
  }

  async verifySinglePayment(paymentId: number) {
    const response = await axiosInstance.post(`/api/nysc/admin/payments/${paymentId}/verify`, {}, {
      timeout: 30000 // 30 seconds timeout
    });
    return response.data;
  }

  // NYSC Upload Analysis methods
  async getUploadAnalysis(fileName?: string) {
    const params = fileName ? { file: fileName } : {};
    const response = await axiosInstance.get('/api/nysc/admin/upload-analysis', {
      params,
      timeout: 120000 // 2 minutes timeout for analysis
    });
    return response.data;
  }

  async exportUnuploadedStudents() {
    const response = await axiosInstance.get('/api/nysc/admin/upload-analysis/export-unuploaded', {
      timeout: 60000 // 1 minute timeout for export
    });
    return response.data;
  }
}

const adminService = new AdminService();
export { adminService };
export default adminService;
