/**
 * Bonuses Service
 * 
 * This module provides bonus-related API methods.
 * It uses the API client to communicate with the backend bonus endpoints.
 * 
 * @module services/api/bonuses.service
 * 
 * @remarks
 * This service handles:
 * - Fetching bonuses for an employee
 * - Creating new bonuses
 * - Updating existing bonuses
 * - Deleting bonuses
 * - Type-safe request/response interfaces
 * 
 * @example
 * ```typescript
 * import { bonusesService } from './services/api/bonuses.service';
 * 
 * // Get all bonuses for an employee
 * const bonuses = await bonusesService.getByEmployeeId(1);
 * 
 * // Create new bonus
 * const newBonus = await bonusesService.create({
 *   employeeId: 1,
 *   type: 'performance',
 *   amount: 1000
 * });
 * ```
 */

import apiClient from './client';

/**
 * Bonus entity interface
 * 
 * Represents a bonus in the system.
 * 
 * @interface Bonus
 */
export interface Bonus {
  id: number;
  employeeId: number;
  type: string;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bonuses response (array)
 * 
 * @interface BonusesResponse
 */
export interface BonusesResponse {
  success: boolean;
  data: Bonus[];
}

/**
 * Single bonus response
 * 
 * @interface BonusResponse
 */
export interface BonusResponse {
  success: boolean;
  data: Bonus;
}

/**
 * Create bonus request payload
 * 
 * @interface CreateBonusRequest
 */
export interface CreateBonusRequest {
  employeeId: number;
  type: string;
  amount: number;
}

/**
 * Update bonus request payload
 * 
 * All fields are optional except id (which is in the URL).
 * 
 * @interface UpdateBonusRequest
 */
export interface UpdateBonusRequest {
  type?: string;
  amount?: number;
}

/**
 * Delete bonus response
 * 
 * @interface DeleteBonusResponse
 */
export interface DeleteBonusResponse {
  success: boolean;
  message: string;
}

/**
 * Bonuses Service Object
 * 
 * Provides methods for bonus operations.
 * All methods return promises that resolve with typed response data.
 * 
 * @namespace bonusesService
 */
export const bonusesService = {
  /**
   * Get all bonuses for an employee
   * 
   * Fetches all bonuses associated with a specific employee.
   * 
   * @param {number} employeeId - Employee ID
   * @returns {Promise<BonusesResponse>} Promise that resolves with bonuses array
   * @throws {AxiosError} If request fails or network error occurs
   * 
   * @example
   * ```typescript
   * const bonuses = await bonusesService.getByEmployeeId(1);
   * console.log(bonuses.data); // Array of Bonus objects
   * ```
   */
  getByEmployeeId: async (employeeId: number): Promise<BonusesResponse> => {
    const response = await apiClient.get<BonusesResponse>(`/bonuses/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Get bonus by ID
   * 
   * Fetches a single bonus by its ID.
   * 
   * @param {number} id - Bonus ID
   * @returns {Promise<BonusResponse>} Promise that resolves with bonus data
   * @throws {AxiosError} If bonus not found or network error occurs
   * 
   * @example
   * ```typescript
   * const bonus = await bonusesService.getById(1);
   * console.log(bonus.data.type);
   * ```
   */
  getById: async (id: number): Promise<BonusResponse> => {
    const response = await apiClient.get<BonusResponse>(`/bonuses/${id}`);
    return response.data;
  },

  /**
   * Create new bonus
   * 
   * Creates a new bonus for an employee.
   * 
   * @param {CreateBonusRequest} bonusData - Bonus data to create
   * @param {number} bonusData.employeeId - Employee ID (required)
   * @param {string} bonusData.type - Bonus type (required, e.g., 'performance', 'annual')
   * @param {number} bonusData.amount - Bonus amount (required)
   * @returns {Promise<BonusResponse>} Promise that resolves with created bonus data
   * @throws {AxiosError} If validation fails or network error occurs
   * 
   * @example
   * ```typescript
   * const newBonus = await bonusesService.create({
   *   employeeId: 1,
   *   type: 'performance',
   *   amount: 1000
   * });
   * ```
   */
  create: async (bonusData: CreateBonusRequest): Promise<BonusResponse> => {
    const response = await apiClient.post<BonusResponse>('/bonuses', bonusData);
    return response.data;
  },

  /**
   * Update bonus
   * 
   * Updates an existing bonus's information.
   * Only provided fields will be updated.
   * 
   * @param {number} id - Bonus ID
   * @param {UpdateBonusRequest} bonusData - Bonus data to update (all fields optional)
   * @returns {Promise<BonusResponse>} Promise that resolves with updated bonus data
   * @throws {AxiosError} If bonus not found, validation fails, or network error occurs
   * 
   * @example
   * ```typescript
   * // Update only amount
   * const updated = await bonusesService.update(1, {
   *   amount: 1500
   * });
   * 
   * // Update multiple fields
   * const updated = await bonusesService.update(1, {
   *   type: 'annual',
   *   amount: 2000
   * });
   * ```
   */
  update: async (id: number, bonusData: UpdateBonusRequest): Promise<BonusResponse> => {
    const response = await apiClient.put<BonusResponse>(`/bonuses/${id}`, bonusData);
    return response.data;
  },

  /**
   * Delete bonus
   * 
   * Deletes a bonus from the system.
   * 
   * @param {number} id - Bonus ID
   * @returns {Promise<DeleteBonusResponse>} Promise that resolves with deletion confirmation
   * @throws {AxiosError} If bonus not found or network error occurs
   * 
   * @example
   * ```typescript
   * await bonusesService.delete(1);
   * console.log('Bonus deleted successfully');
   * ```
   */
  delete: async (id: number): Promise<DeleteBonusResponse> => {
    const response = await apiClient.delete<DeleteBonusResponse>(`/bonuses/${id}`);
    return response.data;
  },
};

