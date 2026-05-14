/**
 * Dashboard Service
 * 
 * This module provides dashboard-related API methods.
 * It uses the API client to communicate with the backend dashboard endpoints.
 * 
 * @module services/api/dashboard.service
 */

import apiClient from './client';

/**
 * Interface for dashboard statistics.
 * @interface DashboardStatistics
 */
export interface DashboardStatistics {
  totalEmployees: number;
  totalMonthlySalary: number;
  averageSalary: number;
  totalDepartments: number;
}

/**
 * Interface for dashboard statistics API response.
 * @interface DashboardStatisticsResponse
 */
export interface DashboardStatisticsResponse {
  success: boolean;
  data: DashboardStatistics;
  error?: string;
}

/**
 * Dashboard Service Class
 * 
 * Provides methods to interact with dashboard-related API endpoints.
 */
class DashboardService {
  /**
   * Get dashboard statistics
   * 
   * Retrieves real-time dashboard statistics including:
   * - Total Employees
   * - Total Monthly Salary (current month)
   * - Average Salary
   * - Total Departments
   * 
   * @returns {Promise<DashboardStatisticsResponse>} A promise that resolves to dashboard statistics
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```typescript
   * const response = await dashboardService.getStatistics();
   * if (response.success) {
   *   console.log('Total Employees:', response.data.totalEmployees);
   * }
   * ```
   */
  async getStatistics(): Promise<DashboardStatisticsResponse> {
    try {
      const response = await apiClient.get<DashboardStatisticsResponse>('/dashboard/statistics');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching dashboard statistics:', error);
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error instanceof Error ? error.message : 'Unknown error') || 'Failed to fetch dashboard statistics');
    }
  }
}

export const dashboardService = new DashboardService();

