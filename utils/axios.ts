import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://academy.veritas.edu.ng/';
// const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nysc_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Only redirect to /login for 401 errors on protected endpoints (not login or verify endpoints)
    if (
      error.response?.status === 401 &&
      originalRequest?.url &&
      !(/\/api\/nysc\/(login|auth\/verify)$/.test(originalRequest.url) || /\/api\/nysc\/admin\/login$/.test(originalRequest.url)) &&
      !originalRequest._skipAuthRedirect
    ) {
      localStorage.removeItem('nysc_token');
      localStorage.removeItem('nysc_user');
      localStorage.removeItem('nysc_user_type');
      localStorage.removeItem('nysc_last_activity');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
