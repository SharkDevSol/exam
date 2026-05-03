import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies (admin/teacher)
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add JWT token for students
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add JWT token for student endpoints
    const token = localStorage.getItem('studentToken');
    if (token && config.url?.startsWith('/student')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Clear student token if on student portal
      if (currentPath.startsWith('/student')) {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentUserId');
        window.location.href = '/student/login';
      } 
      // Redirect admin to admin login
      else if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
      // Redirect teacher to teacher login
      else if (currentPath.startsWith('/teacher')) {
        window.location.href = '/teacher/login';
      }
    }

    // Handle forbidden errors (wrong role)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Helper function to check if error is a specific status code
export function isErrorStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}

export default api;
