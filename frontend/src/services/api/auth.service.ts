/**
 * Authentication Service
 * 
 * This module provides authentication-related API methods.
 * It uses the API client to communicate with the backend authentication endpoints.
 * 
 * @module services/api/auth.service
 * 
 * @remarks
 * This service handles:
 * - User login
 * - API communication for authentication
 * - Type-safe request/response interfaces
 * 
 * @example
 * ```typescript
 * import { authService } from './services/api/auth.service';
 * 
 * const response = await authService.login({
 *   username: 'john_doe',
 *   password: 'password123'
 * });
 * 
 * // Store token and user data
 * localStorage.setItem('token', response.data.token);
 * localStorage.setItem('user', JSON.stringify(response.data.user));
 * ```
 */

import apiClient from './client';

/**
 * Login request payload
 * 
 * @interface LoginRequest
 * @property {string} username - User's username
 * @property {string} password - User's plain text password
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response structure
 * 
 * @interface LoginResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {Object} data - Response data
 * @property {Object} data.user - Authenticated user information
 * @property {number} data.user.id - User ID
 * @property {string} data.user.username - Username
 * @property {string} data.user.role - User role (Admin, Accountant, Employee, Management)
 * @property {string} data.token - JWT authentication token
 */
export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      username: string;
      role: string;
    };
    token: string;
  };
}

/**
 * Authentication Service Object
 * 
 * Provides methods for authentication operations.
 * All methods return promises that resolve with typed response data.
 * 
 * @namespace authService
 */
export const authService = {
  /**
   * Login method
   * 
   * Authenticates a user with username and password.
   * Sends credentials to the backend and receives user data and JWT token.
   * 
   * @param {LoginRequest} credentials - User login credentials
   * @param {string} credentials.username - User's username
   * @param {string} credentials.password - User's plain text password
   * @returns {Promise<LoginResponse>} Promise that resolves with login response
   * @throws {AxiosError} If authentication fails or network error occurs
   * 
   * @example
   * ```typescript
   * try {
   *   const response = await authService.login({
   *     username: 'john_doe',
   *     password: 'password123'
   *   });
   * 
   *   if (response.success) {
   *     // Store authentication data
   *     localStorage.setItem('token', response.data.token);
   *     localStorage.setItem('user', JSON.stringify(response.data.user));
   *     
   *     // Redirect to dashboard
   *     navigate('/dashboard');
   *   }
   * } catch (error) {
   *   // Handle error (invalid credentials, network error, etc.)
   *   console.error('Login failed:', error);
   * }
   * ```
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Make POST request to /auth/login endpoint
    // The API client automatically adds Authorization header if token exists
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    // Return response data (already typed as LoginResponse)
    return response.data;
  },
};

