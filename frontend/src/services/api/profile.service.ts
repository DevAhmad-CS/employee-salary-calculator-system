/**
 * Profile Service
 * 
 * This module provides profile-related API methods.
 * It uses the API client to communicate with the backend profile endpoints.
 * 
 * @module services/api/profile.service
 */

import apiClient from './client';

/**
 * User profile interface
 * 
 * @interface Profile
 */
export interface Profile {
  id: number;
  username: string;
  role: 'Admin' | 'Accountant' | 'Employee' | 'Management';
  employeeId?: number | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update profile request payload
 * 
 * @interface UpdateProfileRequest
 */
export interface UpdateProfileRequest {
  username?: string;
  role?: 'Admin' | 'Accountant' | 'Employee' | 'Management';
  employeeId?: number | null;
}

/**
 * Change password request payload
 * 
 * @interface ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Profile response structure
 * 
 * @interface ProfileResponse
 */
export interface ProfileResponse {
  success: boolean;
  data: Profile;
  error?: string;
}

/**
 * Change password response structure
 * 
 * @interface ChangePasswordResponse
 */
export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Profile Service Object
 * 
 * Provides methods for profile operations.
 */
export const profileService = {
  /**
   * Get current user's profile
   * 
   * @returns {Promise<ProfileResponse>} Promise that resolves with profile response
   * @throws {AxiosError} If request fails or network error occurs
   */
  getProfile: async (): Promise<ProfileResponse> => {
    try {
      const response = await apiClient.get<ProfileResponse>('/profile');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error instanceof Error ? error.message : 'Unknown error') || 'Failed to fetch profile');
    }
  },

  /**
   * Update current user's profile
   * 
   * @param {UpdateProfileRequest} data - Profile update data
   * @returns {Promise<ProfileResponse>} Promise that resolves with updated profile response
   * @throws {AxiosError} If request fails or network error occurs
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    try {
      const response = await apiClient.put<ProfileResponse>('/profile', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error instanceof Error ? error.message : 'Unknown error') || 'Failed to update profile');
    }
  },

  /**
   * Change current user's password
   * 
   * @param {ChangePasswordRequest} data - Password change data
   * @returns {Promise<ChangePasswordResponse>} Promise that resolves with change password response
   * @throws {AxiosError} If request fails or network error occurs
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    try {
      const response = await apiClient.post<ChangePasswordResponse>('/profile/change-password', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error instanceof Error ? error.message : 'Unknown error') || 'Failed to change password');
    }
  },
};

