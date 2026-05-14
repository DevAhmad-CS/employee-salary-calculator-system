/**
 * Dashboard Controller
 * 
 * Handles HTTP requests related to dashboard operations.
 * 
 * @module infrastructure/http/express/controllers/DashboardController
 */

import { Request, Response } from 'express';
import { GetDashboardStatisticsUseCase } from '../../../../application/use-cases/dashboard/GetDashboardStatisticsUseCase';

/**
 * Controller for handling dashboard-related HTTP requests.
 */
export class DashboardController {
  private getDashboardStatisticsUseCase: GetDashboardStatisticsUseCase;

  /**
   * Creates an instance of DashboardController.
   * @param {GetDashboardStatisticsUseCase} getDashboardStatisticsUseCase - The use case for getting dashboard statistics.
   */
  constructor(getDashboardStatisticsUseCase: GetDashboardStatisticsUseCase) {
    this.getDashboardStatisticsUseCase = getDashboardStatisticsUseCase;
  }

  /**
   * Get dashboard statistics endpoint handler
   * 
   * Handles GET requests to retrieve dashboard statistics.
   * 
   * @route GET /api/dashboard/statistics
   * @access Protected (requires authentication)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with dashboard statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.getDashboardStatisticsUseCase.execute();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      console.error('Error getting dashboard statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve dashboard statistics',
      });
    }
  };
}

