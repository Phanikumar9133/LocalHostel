// src/services/api.js
import axios from 'axios';

const API_URL = 'https://localhostel.onrender.com/api'; // Nee deployed backend

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 240000
});

// Add token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('[API DEBUG] Sending request to:', config.url);
  console.log('[API DEBUG] Authorization header:', token ? `Bearer ${token.substring(0, 10)}...` : 'MISSING TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;