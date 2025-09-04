import axiosInstance from '@/utils/axios';

interface AdminSettings {
  payment_amount: number;
  payment_deadline: string;
  countdown_title: string;
  countdown_message: string;
  system_open: boolean;
  late_payment_fee: number;
}

interface SystemStatusWithSettings {
  is_open: boolean;
  deadline: string;
  is_late_fee: boolean;
  current_fee: number;
  payment_amount: number;
  late_payment_fee: number;
  countdown_title: string;
  countdown_message: string;
}

class AdminSettingsService {
  /**
   * Get admin settings
   */
  async getSettings(): Promise<AdminSettings> {
    try {
      const response = await axiosInstance.get('/api/nysc/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }
  }

  /**
   * Update admin settings
   */
  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    try {
      const response = await axiosInstance.put('/api/nysc/admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }

  /**
   * Get system status with dynamic settings for students
   */
  async getSystemStatusWithSettings(): Promise<SystemStatusWithSettings> {
    try {
      const response = await axiosInstance.get('/api/nysc/admin/dashboard-with-settings');
      const data = response.data;
      
      // Use backend-calculated system status instead of client-side calculation
      const systemStatus = data.system_status || {};
      
      return {
        is_open: systemStatus.is_open ?? data.settings.system_open,
        deadline: systemStatus.deadline ?? data.settings.payment_deadline,
        is_late_fee: systemStatus.is_late_fee ?? false,
        current_fee: systemStatus.current_fee ?? data.settings.payment_amount,
        payment_amount: systemStatus.payment_amount ?? data.settings.payment_amount,
        late_payment_fee: systemStatus.late_payment_fee ?? data.settings.late_payment_fee,
        countdown_title: systemStatus.countdown_title ?? data.settings.countdown_title,
        countdown_message: systemStatus.countdown_message ?? data.settings.countdown_message
      };
    } catch (error) {
      console.error('Error fetching system status with settings:', error);
      throw error;
    }
  }
}

export const adminSettingsService = new AdminSettingsService();
export type { AdminSettings, SystemStatusWithSettings };