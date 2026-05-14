/**
 * Deductions Service
 * 
 * This module provides deduction-related API methods.
 * It uses the API client to communicate with the backend deduction endpoints.
 * 
 * @module services/api/deductions.service
 * 
 * @remarks
 * This service handles:
 * - Fetching deductions for an employee
 * - Creating new deductions
 * - Updating existing deductions
 * - Deleting deductions
 * - Type-safe request/response interfaces
 * 
 * @example
 * ```typescript
 * import { deductionsService } from './services/api/deductions.service';
 * 
 * // Get all deductions for an employee
 * const deductions = await deductionsService.getByEmployeeId(1);
 * 
 * // Create new deduction
 * const newDeduction = await deductionsService.create({
 *   employeeId: 1,
 *   type: 'tax',
 *   amount: 200
 * });
 * ```
 */

import apiClient from './client';

/**
 * Deduction entity interface
 * 
 * Represents a deduction in the system.
 * 
 * @interface Deduction
 */
export interface Deduction {
  id: number;
  employeeId: number;
  type: string;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deductions response (array)
 * 
 * @interface DeductionsResponse
 */
export interface DeductionsResponse {
  success: boolean;
  data: Deduction[];
}

/**
 * Single deduction response
 * 
 * @interface DeductionResponse
 */
export interface DeductionResponse {
  success: boolean;
  data: Deduction;
}

/**
 * Create deduction request payload
 * 
 * @interface CreateDeductionRequest
 */
export interface CreateDeductionRequest {
  employeeId: number;
  type: string;
  amount: number;
}

/**
 * Update deduction request payload
 * 
 * All fields are optional except id (which is in the URL).
 * 
 * @interface UpdateDeductionRequest
 */
export interface UpdateDeductionRequest {
  type?: string;
  amount?: number;
}

/**
 * Delete deduction response
 * 
 * @interface DeleteDeductionResponse
 */
export interface DeleteDeductionResponse {
  success: boolean;
  message: string;
}

/**
 * Deductions Service Object
 * 
 * Provides methods for deduction operations.
 * All methods return promises that resolve with typed response data.
 * 
 * @namespace deductionsService
 */
export const deductionsService = {
  /**
   * Get all deductions for an employee
   * 
   * Fetches all deductions associated with a specific employee.
   * 
   * @param {number} employeeId - Employee ID
   * @returns {Promise<DeductionsResponse>} Promise that resolves with deductions array
   * @throws {AxiosError} If request fails or network error occurs
   * 
   * @example
   * ```typescript
   * const deductions = await deductionsService.getByEmployeeId(1);
   * console.log(deductions.data); // Array of Deduction objects
   * ```
   */
  getByEmployeeId: async (employeeId: number): Promise<DeductionsResponse> => {
    const response = await apiClient.get<DeductionsResponse>(`/deductions/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Get deduction by ID
   * 
   * Fetches a single deduction by its ID.
   * 
   * @param {number} id - Deduction ID
   * @returns {Promise<DeductionResponse>} Promise that resolves with deduction data
   * @throws {AxiosError} If deduction not found or network error occurs
   * 
   * @example
   * ```typescript
   * const deduction = await deductionsService.getById(1);
   * console.log(deduction.data.type);
   * ```
   */
  getById: async (id: number): Promise<DeductionResponse> => {
    const response = await apiClient.get<DeductionResponse>(`/deductions/${id}`);
    return response.data;
  },

  /**
   * Create new deduction
   * 
   * Creates a new deduction for an employee.
   * 
   * @param {CreateDeductionRequest} deductionData - Deduction data to create
   * @param {number} deductionData.employeeId - Employee ID (required)
   * @param {string} deductionData.type - Deduction type (required, e.g., 'tax', 'insurance')
   * @param {number} deductionData.amount - Deduction amount (required)
   * @returns {Promise<DeductionResponse>} Promise that resolves with created deduction data
   * @throws {AxiosError} If validation fails or network error occurs
   * 
   * @example
   * ```typescript
   * const newDeduction = await deductionsService.create({
   *   employeeId: 1,
   *   type: 'tax',
   *   amount: 200
   * });
   * ```
   */
  create: async (deductionData: CreateDeductionRequest): Promise<DeductionResponse> => {
    const response = await apiClient.post<DeductionResponse>('/deductions', deductionData);
    return response.data;
  },

  /**
   * Update deduction
   * 
   * Updates an existing deduction's information.
   * Only provided fields will be updated.
   * 
   * @param {number} id - Deduction ID
   * @param {UpdateDeductionRequest} deductionData - Deduction data to update (all fields optional)
   * @returns {Promise<DeductionResponse>} Promise that resolves with updated deduction data
   * @throws {AxiosError} If deduction not found, validation fails, or network error occurs
   * 
   * @example
   * ```typescript
   * // Update only amount
   * const updated = await deductionsService.update(1, {
   *   amount: 250
   * });
   * 
   * // Update multiple fields
   * const updated = await deductionsService.update(1, {
   *   type: 'insurance',
   *   amount: 300
   * });
   * ```
   */
  update: async (id: number, deductionData: UpdateDeductionRequest): Promise<DeductionResponse> => {
    const response = await apiClient.put<DeductionResponse>(`/deductions/${id}`, deductionData);
    return response.data;
  },

  /**
   * Delete deduction
   * 
   * Deletes a deduction from the system.
   * 
   * @param {number} id - Deduction ID
   * @returns {Promise<DeleteDeductionResponse>} Promise that resolves with deletion confirmation
   * @throws {AxiosError} If deduction not found or network error occurs
   * 
   * @example
   * ```typescript
   * await deductionsService.delete(1);
   * console.log('Deduction deleted successfully');
   * ```
   */
  delete: async (id: number): Promise<DeleteDeductionResponse> => {
    const response = await apiClient.delete<DeleteDeductionResponse>(`/deductions/${id}`);
    return response.data;
  },
};

