import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the auth token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      // Dispatch a custom event or let AuthContext handle the cleanup
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
  }
  return Promise.reject(error);
});
