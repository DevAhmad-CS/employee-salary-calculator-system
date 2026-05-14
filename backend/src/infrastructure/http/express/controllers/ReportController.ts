/**
 * Report Controller
 * 
 * Handles HTTP requests related to report generation and retrieval.
 * This controller is responsible for processing report-related API endpoints.
 */

import { Request, Response } from 'express';
import { GenerateReportUseCase, GenerateReportRequest } from '../../../../application/use-cases/reports/GenerateReportUseCase';
import { ISalarySlipRepository } from '../../../../domain/interfaces/ISalarySlipRepository';
import { IEmployeeRepository } from '../../../../domain/interfaces/IEmployeeRepository';

/**
 * Report Controller class
 * 
 * Handles all report-related HTTP requests including:
 * - Generating monthly reports
 * - Generating annual reports
 */
export class ReportController {
  private generateReportUseCase: GenerateReportUseCase;
  private salarySlipRepository: ISalarySlipRepository;

  /**
   * Creates an instance of ReportController.
   * 
   * @param {ISalarySlipRepository} salarySlipRepository - Repository for salary slip data access
   * @param {IEmployeeRepository} employeeRepository - Repository for employee data access
   */
  constructor(
    salarySlipRepository: ISalarySlipRepository,
    employeeRepository: IEmployeeRepository
  ) {
    this.salarySlipRepository = salarySlipRepository;
    this.generateReportUseCase = new GenerateReportUseCase(
      salarySlipRepository,
      employeeRepository
    );
  }

  /**
   * Generates a report (monthly or annual) based on the request parameters.
   * 
   * POST /api/reports/generate
   * 
   * Request body:
   * {
   *   type: 'monthly' | 'annual',
   *   month?: number (1-12, required for monthly),
   *   year: number,
   *   department?: string,
   *   employeeId?: number,
   *   minSalary?: number,
   *   maxSalary?: number
   * }
   * 
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { type, month, year, department, employeeId, minSalary, maxSalary } = req.body;

      // Validate required fields
      if (!type || !year) {
        res.status(400).json({
          success: false,
          error: 'Report type and year are required.',
        });
        return;
      }

      if (type === 'monthly' && !month) {
        res.status(400).json({
          success: false,
          error: 'Month is required for monthly reports.',
        });
        return;
      }

      // Build request object
      const request: GenerateReportRequest = {
        type,
        year: parseInt(year),
        ...(month && { month: parseInt(month) }),
        ...(department && { department }),
        ...(employeeId && { employeeId: parseInt(employeeId) }),
        ...(minSalary !== undefined && { minSalary: parseFloat(minSalary) }),
        ...(maxSalary !== undefined && { maxSalary: parseFloat(maxSalary) }),
      };

      // Generate report
      const report = await this.generateReportUseCase.execute(request);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate report.',
      });
    }
  }

  /**
   * Gets the history of generated reports.
   * 
   * GET /api/reports/history
   * 
   * Query parameters:
   * - type?: 'monthly' | 'annual' (optional filter)
   * - year?: number (optional filter)
   * 
   * Response:
   * {
   *   success: true,
   *   data: [
   *     {
   *       type: 'monthly' | 'annual',
   *       period: { month?, year, monthName? },
   *       generatedAt: Date
   *     }
   *   ]
   * }
   * 
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getReportHistory(req: Request, res: Response): Promise<void> {
    try {
      const { type, year } = req.query;
      const yearFilter = year ? parseInt(year as string) : undefined;

      // Get unique month/year combinations from salary slips for monthly reports
      const monthlyReports: Array<{ type: string; period: { month: number; year: number; monthName: string }; generatedAt: Date }> = [];
      
      if (!type || type === 'monthly') {
        const monthlyHistory = await this.salarySlipRepository.getMonthlyReportHistory(yearFilter);
        
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        monthlyReports.push(...monthlyHistory.map((item: { month: number; year: number; generatedAt: Date }) => ({
          type: 'monthly',
          period: {
            month: item.month,
            year: item.year,
            monthName: monthNames[item.month - 1],
          },
          generatedAt: item.generatedAt,
        })));
      }

      // Get unique years from salary slips for annual reports
      const annualReports: Array<{ type: string; period: { year: number }; generatedAt: Date }> = [];
      
      if (!type || type === 'annual') {
        const annualHistory = await this.salarySlipRepository.getAnnualReportHistory(yearFilter);
        
        annualReports.push(...annualHistory.map((item: { year: number; generatedAt: Date }) => ({
          type: 'annual',
          period: {
            year: item.year,
          },
          generatedAt: item.generatedAt,
        })));
      }

      // Combine and sort by generated date
      const allReports = [...monthlyReports, ...annualReports].sort(
        (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime()
      );

      res.status(200).json({
        success: true,
        data: allReports,
      });
    } catch (error: any) {
      console.error('Error getting report history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get report history.',
      });
    }
  }
}

