import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AuthResponse {
  token: string;
  username: string;
}

export const register = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/auth/register`, { username, password });
  return response.data;
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/auth/login`, { username, password });
  return response.data;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

// Add axios interceptor to attach token to requests
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers = new AxiosHeaders({
      ...config.headers,
      Authorization: `Bearer ${token}`
    });
  }
  return config;
}); 