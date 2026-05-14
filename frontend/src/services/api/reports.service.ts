/**
 * Reports Service
 * 
 * Handles all API calls related to report generation and retrieval.
 */

import apiClient from './client';

/**
 * Report type: monthly or annual
 */
export type ReportType = 'monthly' | 'annual';

/**
 * Request interface for generating a report
 */
export interface GenerateReportRequest {
  type: ReportType;
  month?: number; // Required for monthly reports (1-12)
  year: number;
  department?: string;
  employeeId?: number;
  minSalary?: number;
  maxSalary?: number;
}

/**
 * Department breakdown in report statistics
 */
export interface DepartmentBreakdown {
  department: string;
  employeeCount: number;
  totalSalary: number;
  averageSalary: number;
}

/**
 * Employee breakdown in report statistics
 */
export interface EmployeeBreakdown {
  employeeId: number;
  employeeName: string;
  department: string;
  netSalary: number;
  month?: number; // For annual reports
}

/**
 * Report statistics
 */
export interface ReportStatistics {
  totalEmployees: number;
  totalSalaries: number;
  averageSalary: number;
  totalSlips: number;
  departmentBreakdown?: DepartmentBreakdown[];
  employeeBreakdown?: EmployeeBreakdown[];
}

/**
 * Report period information
 */
export interface ReportPeriod {
  month?: number;
  year: number;
  monthName?: string;
}

/**
 * Generated report response
 */
export interface GeneratedReport {
  type: ReportType;
  period: ReportPeriod;
  statistics: ReportStatistics;
  generatedAt: string;
}

/**
 * API response wrapper for reports
 */
export interface ReportResponse {
  success: boolean;
  data: GeneratedReport;
  error?: string;
}

/**
 * Report history item
 */
export interface ReportHistoryItem {
  type: ReportType;
  period: ReportPeriod;
  generatedAt: string;
}

/**
 * Report history response
 */
export interface ReportHistoryResponse {
  success: boolean;
  data: ReportHistoryItem[];
  error?: string;
}

/**
 * Reports Service Class
 * 
 * Provides methods to interact with the reports API endpoints.
 */
class ReportsService {
  /**
   * Generates a monthly or annual report.
   * 
   * @param {GenerateReportRequest} request - Report generation request
   * @returns {Promise<ReportResponse>} Promise resolving to the generated report
   * @throws {Error} If the request fails
   * 
   * @example
   * ```typescript
   * const report = await reportsService.generate({
   *   type: 'monthly',
   *   month: 1,
   *   year: 2024
   * });
   * ```
   */
  async generate(request: GenerateReportRequest): Promise<ReportResponse> {
    try {
      const response = await apiClient.post<{ success: boolean; data: GeneratedReport; error?: string }>('/reports/generate', request);
      
      // Check if response is successful
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data?.error || 'Failed to generate report');
      }
    } catch (error: unknown) {
      console.error('Error generating report:', error);
      const apiErr = error as { response?: { data?: { error?: string } } };
      throw new Error(
        apiErr.response?.data?.error ||
          (error instanceof Error ? error.message : 'Failed to generate report')
      );
    }
  }

  /**
   * Gets the history of generated reports.
   * 
   * @param {object} filters - Optional filters
   * @param {ReportType} filters.type - Filter by report type
   * @param {number} filters.year - Filter by year
   * @returns {Promise<ReportHistoryResponse>} Promise resolving to the report history
   * @throws {Error} If the request fails
   * 
   * @example
   * ```typescript
   * const history = await reportsService.getHistory({ type: 'monthly' });
   * ```
   */
  async getHistory(filters?: { type?: ReportType; year?: number }): Promise<ReportHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.year) params.append('year', filters.year.toString());
      
      const queryString = params.toString();
      const url = `/reports/history${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<ReportHistoryResponse>(url);
      return response.data;
    } catch (error: unknown) {
      console.error('Error getting report history:', error);
      throw new Error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error instanceof Error ? error.message : 'Unknown error') || 'Failed to get report history');
    }
  }
}

// Export singleton instance
export const reportsService = new ReportsService();

