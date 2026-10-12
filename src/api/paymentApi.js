import { paymentClient } from './axiosInstances';
import { getStoredUser } from '../utils/tokenUtils';

export const paymentApi = {
  processPayment: async ({ bookingReference, amount, currency = 'INR', idempotencyKey, paymentId }) => {
    const user = getStoredUser();
    const userId = user?.id ? Number(user.id) : 1;

    const payload = {
      bookingReference,
      amount: Number(amount),
      currency: currency || 'INR',
      userId: userId,
      idempotencyKey: idempotencyKey || `idemp_${bookingReference}_${Date.now()}`,
      ...(paymentId !== undefined ? { paymentId: Number(paymentId) } : {})
    };
    console.log('📡 [Payment API Step 1] POST http://localhost:8084/api/payments', payload);
    const res = await paymentClient.post('/api/payments', payload);
    return res.data;
  },

  createRazorpayOrder: async (paymentReference) => {
    console.log(`📡 [Payment API Step 2] POST http://localhost:8084/api/payments/${paymentReference}/orders`);
    try {
      const res = await paymentClient.post(`/api/payments/${paymentReference}/orders`);
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn('⚠️ /orders returned 404, trying /create-order...');
        const res = await paymentClient.post(`/api/payments/${paymentReference}/create-order`);
        return res.data;
      }
      throw err;
    }
  },

  syncPayment: async (paymentReference) => {
    console.log(`📡 [Payment API Sync] POST http://localhost:8084/api/payments/${paymentReference}/sync`);
    const res = await paymentClient.post(`/api/payments/${paymentReference}/sync`);
    return res.data;
  },

  verifyPayment: async (paymentReference, extra = {}) => {
    const payload = {
      paymentReference,
      ...extra
    };
    console.log('📡 [Payment API Step 4 Mock Fallback] POST http://localhost:8084/api/payments/verify', payload);
    const res = await paymentClient.post('/api/payments/verify', payload);
    return res.data;
  },

  verifyRazorpayPayment: async ({ razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
    const payload = {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    };
    console.log('📡 [Payment API Step 4] POST http://localhost:8084/api/payments/verify/razorpay', payload);
    try {
      const res = await paymentClient.post('/api/payments/verify/razorpay', payload);
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        try {
          console.warn('⚠️ /api/payments/verify/razorpay returned 404, trying /api/payments/verify-razorpay...');
          const res = await paymentClient.post('/api/payments/verify-razorpay', payload);
          return res.data;
        } catch {
          console.warn('⚠️ trying /api/payments/verify...');
          const res = await paymentClient.post('/api/payments/verify', payload);
          return res.data;
        }
      }
      throw err;
    }
  },

  getPaymentByRef: async (paymentReference) => {
    console.log(`📡 [Payment API] GET http://localhost:8084/api/payments/${paymentReference}`);
    const res = await paymentClient.get(`/api/payments/${paymentReference}`);
    return res.data;
  },

  getPaymentByBookingRef: async (bookingReference) => {
    console.log(`📡 [Payment API] GET http://localhost:8084/api/payments/by-booking/${bookingReference}`);
    const res = await paymentClient.get(`/api/payments/by-booking/${bookingReference}`);
    return Array.isArray(res.data) ? res.data[0] : res.data;
  },

  retryPayment: async (paymentReference) => {
    console.log(`📡 [Payment API] POST http://localhost:8084/api/payments/${paymentReference}/retry`);
    const res = await paymentClient.post(`/api/payments/${paymentReference}/retry`);
    return res.data;
  },

  requestRefund: async (paymentReference, refundData) => {
    console.log(`📡 [Payment API] POST http://localhost:8084/api/payments/${paymentReference}/refunds`, refundData);
    const user = getStoredUser();
    const userId = user?.id ? Number(user.id) : 1;

    const payload = {
      idempotencyKey: refundData.idempotencyKey || `idemp_ref_${paymentReference}_${Date.now()}`,
      userId: refundData.userId !== undefined ? Number(refundData.userId) : userId,
      paymentId: refundData.paymentId !== undefined ? Number(refundData.paymentId) : 1,
      amount: Number(refundData.amount)
    };
    console.log('📡 [Payment API Refund Payload]', payload);
    const res = await paymentClient.post(`/api/payments/${paymentReference}/refunds`, payload);
    return res.data;
  },

  getRefundsByPayment: async (paymentReference) => {
    console.log(`📡 [Payment API] GET http://localhost:8084/api/payments/${paymentReference}/refunds`);
    const res = await paymentClient.get(`/api/payments/${paymentReference}/refunds`);
    return res.data;
  },

  getRefundByRef: async (refundReference) => {
    console.log(`📡 [Payment API] GET http://localhost:8084/api/refunds/${refundReference}`);
    const res = await paymentClient.get(`/api/refunds/${refundReference}`);
    return res.data;
  },

  triggerDummyWebhook: async (paymentReference, status = 'SUCCESS', transactionId = 'TXN-999') => {
    console.log('📡 [Payment API] POST http://localhost:8084/api/payments/webhooks/dummy', { paymentReference, status, transactionId });
    const res = await paymentClient.post('/api/payments/webhooks/dummy', { paymentReference, status, transactionId });
    return res.data;
  }
};
