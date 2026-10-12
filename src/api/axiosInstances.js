import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

export const USER_SERVICE_URL = 'http://localhost:8081';
export const MOVIE_SERVICE_URL = 'http://localhost:8082';
export const BOOKING_SERVICE_URL = 'http://localhost:8083';
export const PAYMENT_SERVICE_URL = 'http://localhost:8084';
export const NOTIFICATION_SERVICE_URL = 'http://localhost:8085';
export const REVIEW_SERVICE_URL = 'http://localhost:8086';

const createInstance = (baseURL, serviceName) => {
  const instance = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const user = JSON.parse(localStorage.getItem('cinebook_user_data') || 'null');
      if (user && user.id) {
        config.headers['X-User-Id'] = user.id;
      }
      console.log(`🚀 [HTTP Request -> ${serviceName}] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
      return config;
    },
    (error) => {
      console.error(`❌ [HTTP Request Setup Error -> ${serviceName}]`, error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      console.log(`✅ [HTTP Response Success <- ${serviceName}] ${response.status} ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      console.warn(`⚠️ [HTTP Backend Unavailable <- ${serviceName}] ${error.message} (${error.config?.baseURL}${error.config?.url})`);
      return Promise.reject(error);
    }
  );

  return instance;
};

export const userClient = createInstance(USER_SERVICE_URL, 'User Service :8081');
export const movieClient = createInstance(MOVIE_SERVICE_URL, 'Movie Service :8082');
export const bookingClient = createInstance(BOOKING_SERVICE_URL, 'Booking Service :8083');
export const paymentClient = createInstance(PAYMENT_SERVICE_URL, 'Payment Service :8084');
export const notificationClient = createInstance(NOTIFICATION_SERVICE_URL, 'Notification Service :8085');
export const reviewClient = createInstance(REVIEW_SERVICE_URL, 'Review Service :8086');
