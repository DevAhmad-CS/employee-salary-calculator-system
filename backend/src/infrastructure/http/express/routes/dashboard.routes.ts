/**
 * Dashboard Routes
 * 
 * Defines all API routes related to dashboard operations.
 * All routes are protected by authentication middleware.
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { GetDashboardStatisticsUseCase } from '../../../../application/use-cases/dashboard/GetDashboardStatisticsUseCase';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';
import { SalarySlipRepository } from '../../../database/repositories/SalarySlipRepository';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Initialize repositories
const employeeRepository = new EmployeeRepository();
const salarySlipRepository = new SalarySlipRepository();

// Initialize use case
const getDashboardStatisticsUseCase = new GetDashboardStatisticsUseCase(
  employeeRepository,
  salarySlipRepository
);

// Initialize controller
const dashboardController = new DashboardController(getDashboardStatisticsUseCase);

/**
 * GET /api/dashboard/statistics
 * 
 * Get dashboard statistics including:
 * - Total Employees
 * - Total Monthly Salary (current month)
 * - Average Salary
 * - Total Departments
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     totalEmployees: number,
 *     totalMonthlySalary: number,
 *     averageSalary: number,
 *     totalDepartments: number
 *   }
 * }
 */
router.get('/statistics', authenticate, dashboardController.getStatistics);

export default router;

