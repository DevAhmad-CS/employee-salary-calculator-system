/**
 * Reports Routes
 * 
 * Defines all API routes related to report generation and management.
 * All routes are protected by authentication middleware.
 */

import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { SalarySlipRepository } from '../../../database/repositories/SalarySlipRepository';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Initialize repositories
const salarySlipRepository = new SalarySlipRepository();
const employeeRepository = new EmployeeRepository();

// Initialize controller
const reportController = new ReportController(
  salarySlipRepository,
  employeeRepository
);

/**
 * POST /api/reports/generate
 * 
 * Generate a monthly or annual report.
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
 * Response:
 * {
 *   success: true,
 *   data: {
 *     type: 'monthly' | 'annual',
 *     period: { month?, year, monthName? },
 *     statistics: { ... },
 *     generatedAt: Date
 *   }
 * }
 */
router.post('/generate', authenticate, (req, res) => {
  reportController.generateReport(req, res);
});

/**
 * GET /api/reports/history
 * 
 * Get the history of generated reports.
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
 */
router.get('/history', authenticate, (req, res) => {
  reportController.getReportHistory(req, res);
});

export default router;

