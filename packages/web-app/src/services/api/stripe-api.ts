import api from '@/lib/api';

interface StripeConfigResponse {
  publishableKey: string;
  mode: 'live' | 'test';
  environment: string;
}

export const stripeApi = {
  getConfig: async () => {
    const response = await api.get('/payment/config');
    return response.data.data as StripeConfigResponse;
  },
};