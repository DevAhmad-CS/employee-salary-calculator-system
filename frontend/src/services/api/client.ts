/**
 * API Client Configuration
 * 
 * This module configures and exports an Axios instance for making HTTP requests
 * to the backend API. It includes request/response interceptors for authentication
 * and error handling.
 * 
 * @module services/api/client
 * 
 * @remarks
 * This client automatically:
 * - Adds JWT token to Authorization header for authenticated requests
 * - Handles 401 errors by clearing auth data and redirecting to login
 * - Uses environment variables for API base URL configuration
 * 
 * @example
 * ```typescript
 * import apiClient from './services/api/client';
 * 
 * // Make authenticated request
 * const response = await apiClient.get('/employees');
 * ```
 */

import axios from 'axios';

/**
 * Base URL for the API
 * 
 * Reads from environment variable VITE_API_URL, defaults to http://localhost:3001/api
 * In Vite, environment variables must be prefixed with VITE_ to be accessible in the browser.
 * 
 * @constant {string}
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Log API base URL for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

/**
 * Axios instance configured for API requests
 * 
 * This instance is pre-configured with:
 * - Base URL from environment variables
 * - JSON content type header
 * - Request/response interceptors for auth and error handling
 * 
 * @constant {ReturnType<typeof axios.create>}
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// ============================================
// Request Interceptor
// ============================================

/**
 * Request interceptor
 * 
 * Automatically adds JWT token to Authorization header for all requests.
 * Token is retrieved from localStorage if available.
 * 
 * @param {InternalAxiosRequestConfig} config - Axios request configuration
 * @returns {InternalAxiosRequestConfig} Modified request configuration with token
 */
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve JWT token from localStorage
    const token = localStorage.getItem('token');
    
    // Add token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
    });
    
    return config;
  },
  (error) => {
    // Handle request configuration errors
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor
// ============================================

/**
 * Response interceptor
 * 
 * Handles API response errors, particularly 401 (Unauthorized) errors.
 * When a 401 error occurs, it clears authentication data and redirects to login page.
 * 
 * @param {any} response - Successful response (passed through unchanged)
 * @param {AxiosError} error - Error response
 * @returns {Promise} Response or rejected promise with error
 * 
 * @example
 * ```typescript
 * // If token expires or is invalid:
 * // 1. Clears localStorage (token, user)
 * // 2. Redirects to /login page
 * ```
 */
apiClient.interceptors.response.use(
  (response) => {
    // Pass through successful responses unchanged
    console.log('API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error: unknown) => {
    const axiosError = error as {
      response?: { status?: number; statusText?: string; data?: unknown };
      config?: { url?: string; baseURL?: string; method?: string };
      message?: string;
      code?: string;
    };
    
    // Build full URL for debugging
    const fullURL = axiosError.config?.baseURL && axiosError.config?.url 
      ? `${axiosError.config.baseURL}${axiosError.config.url}` 
      : 'Unknown URL';
    
    // Extract error message from response data
    const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'error' in axiosError.response.data
      ? (axiosError.response.data as { error?: string }).error
      : axiosError.message || 'Unknown error';
    
    // Log detailed error for debugging
    console.error('🔴 API Response Error:', {
      method: axiosError.config?.method?.toUpperCase() || 'UNKNOWN',
      status: axiosError.response?.status || 'NO STATUS',
      statusText: axiosError.response?.statusText || 'NO STATUS TEXT',
      url: axiosError.config?.url || 'NO URL',
      baseURL: axiosError.config?.baseURL || 'NO BASE URL',
      fullURL: fullURL,
      message: errorMessage,
      code: axiosError.code || 'NO CODE',
      responseData: axiosError.response?.data,
    });
    
    // Specific error messages based on status code
    if (axiosError.response?.status === 404) {
      console.error('❌ 404 Not Found:', `The route "${fullURL}" does not exist on the server.`);
      console.error('💡 Check:', '1. Is the Backend running? 2. Is the route defined correctly? 3. Is the URL correct?');
    } else if (axiosError.response?.status === 401) {
      console.error('🔐 401 Unauthorized:', 'Authentication failed. Token may be missing or invalid.');
    } else if (axiosError.response?.status === 403) {
      console.error('🚫 403 Forbidden:', 'You do not have permission to access this resource.');
    } else if (axiosError.response?.status === 400) {
      console.error('⚠️ 400 Bad Request:', errorMessage || 'Invalid request data.');
    } else if (axiosError.response?.status === 500) {
      console.error('🔥 500 Internal Server Error:', 'Server error. Check backend logs for details.');
    }
    
    // Handle network errors (no response from server)
    if (!axiosError.response) {
      console.error('Network Error - No response from server:', {
        message: axiosError.message,
        code: axiosError.code,
        baseURL: API_BASE_URL,
      });
      
      // Check if it's a timeout
      if (axiosError.code === 'ECONNABORTED' || (axiosError.message && axiosError.message.includes('timeout'))) {
        console.error('Request timeout - Server may be slow or unreachable');
      } else if (axiosError.code === 'ERR_NETWORK' || (axiosError.message && axiosError.message.includes('Network Error'))) {
        console.error('Network Error - Cannot connect to server. Check if backend is running on:', API_BASE_URL);
      }
    }
    
    // Handle 401 Unauthorized errors
    if (axiosError.response?.status === 401) {
      // Clear authentication data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      // Using window.location.href for full page reload to clear any cached state
      window.location.href = '/login';
    }
    
    // Reject with error for further handling by calling code
    return Promise.reject(error);
  }
);

/**
 * Default export of the configured API client
 * 
 * Use this instance for all API requests throughout the application.
 */
export default apiClient;

