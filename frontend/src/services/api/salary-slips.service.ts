/**
 * Salary Slip Service
 * 
 * This module provides salary slip-related API methods.
 * It uses the API client to communicate with the backend salary slip endpoints.
 * 
 * @module services/api/salary-slips.service
 * 
 * @remarks
 * This service handles:
 * - Generating new salary slips
 * - Fetching salary slips by ID
 * - Fetching salary slips by employee ID
 * - Fetching salary slips by month and year
 * - Type-safe request/response interfaces
 * 
 * @example
 * ```typescript
 * import { salarySlipService } from './services/api/salary-slips.service';
 * 
 * // Generate a salary slip
 * const slip = await salarySlipService.generate({
 *   employeeId: 1,
 *   month: 12,
 *   year: 2024
 * });
 * 
 * // Get all salary slips for an employee
 * const slips = await salarySlipService.getByEmployeeId(1);
 * ```
 */

import apiClient from './client';

/**
 * Salary Slip entity interface
 * 
 * Represents a salary slip in the system.
 * 
 * @interface SalarySlip
 */
export interface SalarySlip {
  id: number;
  employeeId: number;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  totalAllowances: number;
  totalBonus: number;
  totalDeductions: number;
  netSalary: number;
  generatedAt: string; // ISO date string
  generatedBy?: number; // Optional: ID of the user who generated it
}

/**
 * Generate salary slip request payload
 * 
 * @interface GenerateSalarySlipRequest
 */
export interface GenerateSalarySlipRequest {
  employeeId: number;
  month: number; // 1-12
  year: number;
}

/**
 * Get salary slips by month and year query parameters
 * 
 * @interface GetSalarySlipsByMonthYearParams
 */
export interface GetSalarySlipsByMonthYearParams {
  month: number; // 1-12
  year: number;
}

/**
 * Single salary slip response
 * 
 * @interface SalarySlipResponse
 */
export interface SalarySlipResponse {
  success: boolean;
  data: SalarySlip;
}

/**
 * Multiple salary slips response
 * 
 * @interface SalarySlipsResponse
 */
export interface SalarySlipsResponse {
  success: boolean;
  data: SalarySlip[];
}

/**
 * Salary Slip Service Object
 * 
 * Provides methods for salary slip operations.
 * All methods return promises that resolve with typed response data.
 * 
 * @namespace salarySlipService
 */
export const salarySlipService = {
  /**
   * Generate a new salary slip
   * 
   * Generates a new salary slip for an employee for a specific month and year.
   * The system will calculate the net salary based on basic salary, allowances, deductions, and bonuses.
   * 
   * @param {GenerateSalarySlipRequest} request - Salary slip generation request
   * @param {number} request.employeeId - Employee ID
   * @param {number} request.month - Month (1-12)
   * @param {number} request.year - Year
   * @returns {Promise<SalarySlipResponse>} Promise that resolves with generated salary slip data
   * @throws {AxiosError} If validation fails, employee not found, slip already exists, or network error occurs
   * 
   * @example
   * ```typescript
   * const slip = await salarySlipService.generate({
   *   employeeId: 1,
   *   month: 12,
   *   year: 2024
   * });
   * console.log(`Net Salary: ${slip.data.netSalary}`);
   * ```
   */
  generate: async (request: GenerateSalarySlipRequest): Promise<SalarySlipResponse> => {
    const response = await apiClient.post<SalarySlipResponse>('/salary-slips/generate', request);
    return response.data;
  },

  /**
   * Get salary slip by ID
   * 
   * Fetches a single salary slip by its ID.
   * 
   * @param {number} id - Salary slip ID
   * @returns {Promise<SalarySlipResponse>} Promise that resolves with salary slip data
   * @throws {AxiosError} If salary slip not found or network error occurs
   * 
   * @example
   * ```typescript
   * const slip = await salarySlipService.getById(1);
   * console.log(slip.data.netSalary);
   * ```
   */
  getById: async (id: number): Promise<SalarySlipResponse> => {
    const response = await apiClient.get<SalarySlipResponse>(`/salary-slips/${id}`);
    return response.data;
  },

  /**
   * Get all salary slips for an employee
   * 
   * Fetches all salary slips associated with a specific employee.
   * 
   * @param {number} employeeId - Employee ID
   * @returns {Promise<SalarySlipsResponse>} Promise that resolves with array of salary slips
   * @throws {AxiosError} If employee not found or network error occurs
   * 
   * @example
   * ```typescript
   * const slips = await salarySlipService.getByEmployeeId(1);
   * console.log(`Total slips: ${slips.data.length}`);
   * ```
   */
  getByEmployeeId: async (employeeId: number): Promise<SalarySlipsResponse> => {
    const response = await apiClient.get<SalarySlipsResponse>(`/salary-slips/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Get all salary slips for a specific month and year
   * 
   * Fetches all salary slips generated for a specific month and year.
   * Useful for generating monthly reports.
   * 
   * @param {GetSalarySlipsByMonthYearParams} params - Query parameters
   * @param {number} params.month - Month (1-12)
   * @param {number} params.year - Year
   * @returns {Promise<SalarySlipsResponse>} Promise that resolves with array of salary slips
   * @throws {AxiosError} If validation fails or network error occurs
   * 
   * @example
   * ```typescript
   * const slips = await salarySlipService.getByMonthYear({
   *   month: 12,
   *   year: 2024
   * });
   * console.log(`December 2024 slips: ${slips.data.length}`);
   * ```
   */
  getByMonthYear: async (params: GetSalarySlipsByMonthYearParams): Promise<SalarySlipsResponse> => {
    const response = await apiClient.get<SalarySlipsResponse>('/salary-slips', {
      params,
    });
    return response.data;
  },
};

