import axiosInstance from '@/utils/axios';

export interface ImportSummary {
  total_extracted: number;
  total_matched: number;
  ready_for_review: number;
}

export interface ReviewData {
  student_id: number;
  matric_no: string;
  student_name: string;
  current_class_of_degree: string | null;
  proposed_class_of_degree: string;
  match_confidence: 'exact' | 'partial';
  needs_update: boolean;
  approved: boolean;
  source: string;
  row_number: number | null;
}

export interface ApprovalData {
  student_id: number;
  matric_no: string;
  proposed_class_of_degree: string;
  approved: boolean;
}

export interface UpdateResult {
  success: boolean;
  updated_count: number;
  error_count: number;
  errors: string[];
}

export interface UploadResponse {
  success: boolean;
  message: string;
  session_id: string;
  summary: ImportSummary;
}

export interface SessionData {
  success: boolean;
  session_id: string;
  original_filename: string;
  summary: ImportSummary;
  review_data: ReviewData[];
  expires_at: string;
}

export interface ImportStats {
  total_students: number;
  students_with_class_degree: number;
  students_without_class_degree: number;
  class_degree_distribution: Record<string, number>;
}

export interface ApiError {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
}

class DocxImportService {
  /**
   * Upload and process a DOCX file
   */
  async uploadDocx(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('docx_file', file);
      
      const response = await axiosInstance.post('/api/nysc/admin/docx-import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file processing
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Upload failed');
      }
      throw new Error(error.message || 'Upload failed');
    }
  }

  /**
   * Get review data for a session
   */
  async getReviewData(sessionId: string): Promise<SessionData> {
    try {
      const response = await axiosInstance.get(`/api/nysc/admin/docx-import/review/${sessionId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Session not found or expired');
      }
      if (error.response?.status === 410) {
        throw new Error('Session has expired');
      }
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to load review data');
      }
      throw new Error(error.message || 'Failed to load review data');
    }
  }

  /**
   * Submit approval decisions and apply updates
   */
  async approveUpdates(sessionId: string, approvals: ApprovalData[]): Promise<{ success: boolean; result: UpdateResult }> {
    try {
      const response = await axiosInstance.post('/api/nysc/admin/docx-import/approve', {
        session_id: sessionId,
        approvals
      }, {
        timeout: 30000, // 30 second timeout for database updates
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to apply updates');
      }
      throw new Error(error.message || 'Failed to apply updates');
    }
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{ success: boolean; stats: ImportStats }> {
    try {
      const response = await axiosInstance.get('/api/nysc/admin/docx-import/stats');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to load statistics');
      }
      throw new Error(error.message || 'Failed to load statistics');
    }
  }

  /**
   * Export complete student NYSC data to Excel
   */
  async exportStudentData(): Promise<Blob> {
    try {
      const response = await axiosInstance.get('/api/nysc/admin/docx-import/export-student-data', {
        responseType: 'blob',
        timeout: 60000, // 60 second timeout for large exports
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        // Try to extract error message from blob
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Export failed');
        } catch {
          throw new Error('Export failed');
        }
      }
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Export failed');
      }
      throw new Error(error.message || 'Export failed');
    }
  }

  /**
   * Download exported file with proper filename handling
   */
  async downloadStudentData(): Promise<{ blob: Blob; filename: string }> {
    try {
      const response = await fetch('/api/nysc/admin/docx-import/export-student-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'student_nysc_data.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      return { blob, filename };
    } catch (error: any) {
      throw new Error(error.message || 'Export failed');
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return { valid: false, error: 'Please select a valid .docx file' };
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'File appears to be empty' };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calculate session time remaining
   */
  getTimeRemaining(expiresAt: string): { hours: number; minutes: number; expired: boolean } {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const timeRemaining = expiry - now;
    
    if (timeRemaining <= 0) {
      return { hours: 0, minutes: 0, expired: true };
    }
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, expired: false };
  }

  /**
   * Validate Class of Degree value
   */
  isValidClassOfDegree(degree: string): boolean {
    const validDegrees = [
      'First Class',
      'Second Class Upper',
      'Second Class Lower',
      'Third Class',
      'Pass'
    ];
    
    return validDegrees.includes(degree);
  }

  /**
   * Get display color for Class of Degree
   */
  getClassOfDegreeColor(degree: string): string {
    switch (degree) {
      case 'First Class':
        return 'text-purple-600 bg-purple-100';
      case 'Second Class Upper':
        return 'text-blue-600 bg-blue-100';
      case 'Second Class Lower':
        return 'text-green-600 bg-green-100';
      case 'Third Class':
        return 'text-orange-600 bg-orange-100';
      case 'Pass':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
}

const docxImportService = new DocxImportService();
export { docxImportService };
export default docxImportService;