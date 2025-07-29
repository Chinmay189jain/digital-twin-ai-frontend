import axios from 'axios';
import { error } from 'console';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // Skip token for login/register
    const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');

    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
