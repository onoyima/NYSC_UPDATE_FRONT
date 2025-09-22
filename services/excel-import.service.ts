import axiosInstance from '@/utils/axios';
import { EligibleImportRecord } from '@/types/admin.types';

class ExcelImportService {
  /**
   * Get eligible records for import from CSV files
   */
  async getEligibleRecords(): Promise<{ records: EligibleImportRecord[], total: number }> {
    const response = await axiosInstance.get('/api/nysc/admin/excel-import/eligible-records');
    // Transform the response to match the expected structure
    return {
      records: response.data.data || [],
      total: response.data.count || 0
    };
  }

  /**
   * Import selected records from CSV files
   */
  async importSelectedRecords(matricNumbers: string[]): Promise<{ success: boolean, imported: number, errors: number }> {
    const response = await axiosInstance.post('/api/nysc/admin/excel-import/import-selected', { matricNumbers });
    return response.data;
  }

  /**
   * Import all eligible records from CSV files
   */
  async importAllRecords(): Promise<{ success: boolean, imported: number, errors: number }> {
    const response = await axiosInstance.post('/api/nysc/admin/excel-import/import-all');
    return response.data;
  }
}

export default new ExcelImportService();