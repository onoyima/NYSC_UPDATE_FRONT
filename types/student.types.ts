export interface StudentUpdateData {
  surname: string;
  firstName: string;
  middleName?: string;
  phoneNumber: string;
  email: string;
  bloodGroup?: string;
  genotype?: string;
  disability?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

export interface PaymentData {
  amount: number;
  email: string;
  reference: string;
  callback_url: string;
}

export interface PaymentVerificationResponse {
  status: 'success' | 'failed';
  reference: string;
  amount: number;
  paidAt?: string;
  gateway_response?: string;
}