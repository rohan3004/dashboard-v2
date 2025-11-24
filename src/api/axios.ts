import axios from 'axios';

// 🛑 ERROR FIX: Do not use 'https' for localhost unless you have configured SSL in Spring Boot.
// The "0x16..." error happens when you send HTTPS traffic to an HTTP port.

// const BASE_URL = 'https://apis.byrohan.in/v1'; 
const BASE_URL = 'https://apis.byrohan.in/v1'; // Switched to HTTP for local dev

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // MANDATORY: Sends the HttpOnly Refresh Token cookie
});

// --- CONCURRENCY LOCK SYSTEM ---
// Used to prevent multiple refresh calls when parallel requests fail
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    // Only attach token if the header isn't explicitly cleared (e.g. by Register page)
    if (token && config.headers['Authorization'] !== '') {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s (and 403s) and Refresh Logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    // 🛑 GUARD 1: If the error came from the REFRESH endpoint, DO NOT retry.
    if (originalRequest.url?.includes('/auth/refresh')) {
      localStorage.removeItem('accessToken');
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 🛑 GUARD 2: If Verify OTP fails, DO NOT retry.
    if (originalRequest.url?.includes('/auth/verify-otp')) {
      return Promise.reject(error);
    }

    // Handle 401 (Unauthorized) AND 403 (Forbidden - sometimes used for expiry)
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      
      // If a refresh is ALREADY happening, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Attempting Silent Refresh due to 401/403...");
        const { data } = await api.post('/auth/refresh');
        const newAccessToken = data.accessToken;

        // 1. Update Storage
        localStorage.setItem('accessToken', newAccessToken);

        // 2. Update Global Headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        // 3. Process Queue
        processQueue(null, newAccessToken);

        // 4. Retry ORIGINAL Request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed -> Logout
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        if (!window.location.pathname.includes('/login')) {
           window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);