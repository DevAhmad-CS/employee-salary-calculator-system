/**
 * Allowances Service
 * 
 * This module provides allowance-related API methods.
 * It uses the API client to communicate with the backend allowance endpoints.
 * 
 * @module services/api/allowances.service
 * 
 * @remarks
 * This service handles:
 * - Fetching allowances for an employee
 * - Creating new allowances
 * - Updating existing allowances
 * - Deleting allowances
 * - Type-safe request/response interfaces
 * 
 * @example
 * ```typescript
 * import { allowancesService } from './services/api/allowances.service';
 * 
 * // Get all allowances for an employee
 * const allowances = await allowancesService.getByEmployeeId(1);
 * 
 * // Create new allowance
 * const newAllowance = await allowancesService.create({
 *   employeeId: 1,
 *   type: 'transport',
 *   amount: 500
 * });
 * ```
 */

import apiClient from './client';

/**
 * Allowance entity interface
 * 
 * Represents an allowance in the system.
 * 
 * @interface Allowance
 */
export interface Allowance {
  id: number;
  employeeId: number;
  type: string;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Allowances response (array)
 * 
 * @interface AllowancesResponse
 */
export interface AllowancesResponse {
  success: boolean;
  data: Allowance[];
}

/**
 * Single allowance response
 * 
 * @interface AllowanceResponse
 */
export interface AllowanceResponse {
  success: boolean;
  data: Allowance;
}

/**
 * Create allowance request payload
 * 
 * @interface CreateAllowanceRequest
 */
export interface CreateAllowanceRequest {
  employeeId: number;
  type: string;
  amount: number;
}

/**
 * Update allowance request payload
 * 
 * All fields are optional except id (which is in the URL).
 * 
 * @interface UpdateAllowanceRequest
 */
export interface UpdateAllowanceRequest {
  type?: string;
  amount?: number;
}

/**
 * Delete allowance response
 * 
 * @interface DeleteAllowanceResponse
 */
export interface DeleteAllowanceResponse {
  success: boolean;
  message: string;
}

/**
 * Allowances Service Object
 * 
 * Provides methods for allowance operations.
 * All methods return promises that resolve with typed response data.
 * 
 * @namespace allowancesService
 */
export const allowancesService = {
  /**
   * Get all allowances for an employee
   * 
   * Fetches all allowances associated with a specific employee.
   * 
   * @param {number} employeeId - Employee ID
   * @returns {Promise<AllowancesResponse>} Promise that resolves with allowances array
   * @throws {AxiosError} If request fails or network error occurs
   * 
   * @example
   * ```typescript
   * const allowances = await allowancesService.getByEmployeeId(1);
   * console.log(allowances.data); // Array of Allowance objects
   * ```
   */
  getByEmployeeId: async (employeeId: number): Promise<AllowancesResponse> => {
    const response = await apiClient.get<AllowancesResponse>(`/allowances/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Get allowance by ID
   * 
   * Fetches a single allowance by its ID.
   * 
   * @param {number} id - Allowance ID
   * @returns {Promise<AllowanceResponse>} Promise that resolves with allowance data
   * @throws {AxiosError} If allowance not found or network error occurs
   * 
   * @example
   * ```typescript
   * const allowance = await allowancesService.getById(1);
   * console.log(allowance.data.type);
   * ```
   */
  getById: async (id: number): Promise<AllowanceResponse> => {
    const response = await apiClient.get<AllowanceResponse>(`/allowances/${id}`);
    return response.data;
  },

  /**
   * Create new allowance
   * 
   * Creates a new allowance for an employee.
   * 
   * @param {CreateAllowanceRequest} allowanceData - Allowance data to create
   * @param {number} allowanceData.employeeId - Employee ID (required)
   * @param {string} allowanceData.type - Allowance type (required, e.g., 'transport', 'housing')
   * @param {number} allowanceData.amount - Allowance amount (required)
   * @returns {Promise<AllowanceResponse>} Promise that resolves with created allowance data
   * @throws {AxiosError} If validation fails or network error occurs
   * 
   * @example
   * ```typescript
   * const newAllowance = await allowancesService.create({
   *   employeeId: 1,
   *   type: 'transport',
   *   amount: 500
   * });
   * ```
   */
  create: async (allowanceData: CreateAllowanceRequest): Promise<AllowanceResponse> => {
    const response = await apiClient.post<AllowanceResponse>('/allowances', allowanceData);
    return response.data;
  },

  /**
   * Update allowance
   * 
   * Updates an existing allowance's information.
   * Only provided fields will be updated.
   * 
   * @param {number} id - Allowance ID
   * @param {UpdateAllowanceRequest} allowanceData - Allowance data to update (all fields optional)
   * @returns {Promise<AllowanceResponse>} Promise that resolves with updated allowance data
   * @throws {AxiosError} If allowance not found, validation fails, or network error occurs
   * 
   * @example
   * ```typescript
   * // Update only amount
   * const updated = await allowancesService.update(1, {
   *   amount: 600
   * });
   * 
   * // Update multiple fields
   * const updated = await allowancesService.update(1, {
   *   type: 'housing',
   *   amount: 1000
   * });
   * ```
   */
  update: async (id: number, allowanceData: UpdateAllowanceRequest): Promise<AllowanceResponse> => {
    const response = await apiClient.put<AllowanceResponse>(`/allowances/${id}`, allowanceData);
    return response.data;
  },

  /**
   * Delete allowance
   * 
   * Deletes an allowance from the system.
   * 
   * @param {number} id - Allowance ID
   * @returns {Promise<DeleteAllowanceResponse>} Promise that resolves with deletion confirmation
   * @throws {AxiosError} If allowance not found or network error occurs
   * 
   * @example
   * ```typescript
   * await allowancesService.delete(1);
   * console.log('Allowance deleted successfully');
   * ```
   */
  delete: async (id: number): Promise<DeleteAllowanceResponse> => {
    const response = await apiClient.delete<DeleteAllowanceResponse>(`/allowances/${id}`);
    return response.data;
  },
};

