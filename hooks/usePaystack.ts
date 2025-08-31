'use client';

import { useCallback } from 'react';
import { PaymentData } from '@/types/student.types';

interface PaystackHookOptions {
  publicKey: string;
  email: string;
  amount: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export const usePaystack = () => {
  const initializePayment = useCallback((options: PaystackHookOptions) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      const handler = (window as any).PaystackPop.setup({
        key: options.publicKey,
        email: options.email,
        amount: options.amount * 100, // Paystack expects amount in kobo
        ref: options.reference,
        callback: function(response: any) {
          options.onSuccess(response.reference);
        },
        onClose: options.onClose,
      });
      handler.openIframe();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return { initializePayment };
};