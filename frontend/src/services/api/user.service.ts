/**
 * User Service
 * 
 * This module provides user-related API methods.
 * It uses the API client to communicate with the backend user endpoints.
 */

import apiClient from './client';

/**
 * User interface (without password)
 */
export interface User {
  id: number;
  username: string;
  role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  employeeId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user by ID response
 */
export interface UserResponse {
  success: boolean;
  data: User;
  error?: string;
}

/**
 * Create user account request payload
 */
export interface CreateUserAccountRequest {
  username: string;
  password: string;
  role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  email: string;
  employeeId?: number | null;
}

/**
 * Create user account response
 */
export interface CreateUserAccountResponse {
  success: boolean;
  data: {
    user: User;
    emailSent: boolean;
  };
  message?: string;
  error?: string;
}

/**
 * User Service Object
 */
export const userService = {
  /**
   * Get user by ID
   * 
   * Fetches a single user by their ID (without password).
   * 
   * @param {number} id - User ID
   * @returns {Promise<UserResponse>} Promise that resolves with user data
   * @throws {AxiosError} If user not found or network error occurs
   */
  getById: async (id: number): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/auth/users/${id}`);
    return response.data;
  },

  /**
   * Create user account
   * 
   * Creates a standalone user account (without requiring an employee).
   * Used for creating Admin, HR, Accountant, or Management accounts.
   * 
   * @param {CreateUserAccountRequest} userData - User data to create
   * @returns {Promise<CreateUserAccountResponse>} Promise that resolves with created user data
   * @throws {AxiosError} If validation fails or network error occurs
   */
  createAccount: async (userData: CreateUserAccountRequest): Promise<CreateUserAccountResponse> => {
    const response = await apiClient.post<CreateUserAccountResponse>('/auth/users', userData);
    return response.data;
  },
};

