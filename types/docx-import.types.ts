// Core data types for DOCX import functionality

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

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  expired: boolean;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
}

// Enum for valid Class of Degree values
export enum ClassOfDegree {
  FIRST_CLASS = 'First Class',
  SECOND_CLASS_UPPER = 'Second Class Upper',
  SECOND_CLASS_LOWER = 'Second Class Lower',
  THIRD_CLASS = 'Third Class',
  PASS = 'Pass'
}

// Enum for match confidence levels
export enum MatchConfidence {
  EXACT = 'exact',
  PARTIAL = 'partial'
}

// Enum for import source types
export enum ImportSource {
  TABLE = 'table',
  TEXT = 'text'
}

// Component prop types
export interface DocxImportFormProps {
  onUploadSuccess: (sessionId: string, summary: ImportSummary) => void;
  onUploadError: (error: string) => void;
}

export interface ImportReviewTableProps {
  data: ReviewData[];
  onApprovalChange: (matricNo: string, approved: boolean) => void;
  onBulkApproval: (approved: boolean) => void;
  isLoading?: boolean;
}

export interface ExcelExportButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showCard?: boolean;
}

// Filter types for review table
export type ReviewFilterType = 'all' | 'needs_update' | 'approved' | 'rejected';

// Status types for various states
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
export type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';
export type ApprovalStatus = 'idle' | 'applying' | 'success' | 'error';

// API response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error handling types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ProcessingError {
  type: 'validation' | 'processing' | 'database' | 'network';
  message: string;
  details?: any;
}

// Configuration types
export interface ImportConfig {
  maxFileSize: number; // in bytes
  allowedExtensions: string[];
  sessionTimeout: number; // in hours
  supportedDegreeTypes: ClassOfDegree[];
}

// Default configuration
export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.docx'],
  sessionTimeout: 6, // 6 hours
  supportedDegreeTypes: [
    ClassOfDegree.FIRST_CLASS,
    ClassOfDegree.SECOND_CLASS_UPPER,
    ClassOfDegree.SECOND_CLASS_LOWER,
    ClassOfDegree.THIRD_CLASS,
    ClassOfDegree.PASS
  ]
};

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type FileUploadHandler = (file: File) => void;
export type ApprovalChangeHandler = (matricNo: string, approved: boolean) => void;
export type BulkApprovalHandler = (approved: boolean) => void;
export type ExportHandler = () => Promise<void>;

// Hook return types
export interface UseDocxImportReturn {
  uploadFile: (file: File) => Promise<UploadResponse>;
  getReviewData: (sessionId: string) => Promise<SessionData>;
  approveUpdates: (sessionId: string, approvals: ApprovalData[]) => Promise<UpdateResult>;
  exportData: () => Promise<ExportResult>;
  isLoading: boolean;
  error: string | null;
}

export interface UseImportStatsReturn {
  stats: ImportStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}