import axiosInstance from '@/utils/axios';
import { PaymentData, PaymentVerificationResponse } from '@/types/student.types';

class PaymentService {
  async initializePayment(data: PaymentData): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const response = await axiosInstance.post('/api/nysc/payment', data);
    return response.data;
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    const response = await axiosInstance.get(`/api/nysc/payment/verify?reference=${reference}`);
    return response.data;
  }
}

export default new PaymentService();