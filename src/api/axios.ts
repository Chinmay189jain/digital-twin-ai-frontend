import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || "/api").trim(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem('token');

    // Endpount that do not require token
    const isPublicEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/password/change/mail/send') ||
      config.url?.includes('/password/change/mail/verify');

    // normal auth token for protected calls
    if (authToken && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
