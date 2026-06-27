import axios from 'axios';

// In Netlify production, API calls to "/api" are server-side proxied to Vercel.
// In local Vite dev mode, we can proxy or point to localhost:3000.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT token if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('scholarmart_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
