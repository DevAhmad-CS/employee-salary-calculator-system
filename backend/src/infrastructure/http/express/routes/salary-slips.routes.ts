/**
 * Salary Slip Routes
 * 
 * This module defines all HTTP routes related to salary slip operations.
 * It uses Express Router to organize salary slip endpoints and connects
 * them to the appropriate controller methods.
 * 
 * @module infrastructure/http/express/routes/salary-slips.routes
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Routes handle URL mapping and delegate to controllers for request processing.
 * All routes defined here are protected by the authentication middleware
 * applied in `app.ts`.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import salarySlipRoutes from './routes/salary-slips.routes';
 * import { authenticate } from './middleware/auth.middleware';
 * app.use('/api/salary-slips', authenticate, salarySlipRoutes);
 * 
 * // Available endpoints (all protected):
 * // POST   /api/salary-slips/generate
 * // GET    /api/salary-slips/:id
 * // GET    /api/salary-slips/employee/:employeeId
 * // GET    /api/salary-slips?month=X&year=Y
 * ```
 */

import { Router } from 'express';
import { SalarySlipController } from '../controllers/SalarySlipController';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Express router instance for salary slip routes
 * 
 * @constant {Router}
 */
const router = Router();

/**
 * Salary slip controller instance
 * 
 * Handles the business logic for salary slip operations.
 * 
 * @constant {SalarySlipController}
 */
const salarySlipController = new SalarySlipController();

/**
 * Generate salary slip route
 * 
 * Generates a new salary slip for an employee for a specific month and year.
 * 
 * @route POST /generate
 * @access Protected (requires authentication)
 * @see SalarySlipController.generate
 */
router.post('/generate', authenticate, salarySlipController.generate);

/**
 * Get salary slips by employee ID route
 * 
 * Retrieves all salary slips for a specific employee.
 * Must come before /:id route to avoid route conflicts.
 * 
 * @route GET /employee/:employeeId
 * @access Protected (requires authentication)
 * @param {number} employeeId - Employee ID
 * @see SalarySlipController.getByEmployeeId
 */
router.get('/employee/:employeeId', authenticate, salarySlipController.getByEmployeeId);

/**
 * Get salary slips by month and year route
 * 
 * Retrieves all salary slips for a specific month and year.
 * Must come before /:id route to avoid route conflicts.
 * 
 * @route GET /?month=X&year=Y
 * @access Protected (requires authentication)
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @see SalarySlipController.getByMonthYear
 */
router.get('/', authenticate, salarySlipController.getByMonthYear);

/**
 * Get salary slip by ID route
 * 
 * Retrieves a single salary slip by its ID.
 * Must come last to avoid route conflicts with more specific routes.
 * 
 * @route GET /:id
 * @access Protected (requires authentication)
 * @param {number} id - Salary slip ID
 * @see SalarySlipController.getById
 */
router.get('/:id', authenticate, salarySlipController.getById);

/**
 * Default export of the salary slip router
 * 
 * This router can be mounted on the main Express app at a specific path.
 * Example: app.use('/api/salary-slips', authenticate, salarySlipRoutes)
 */
export default router;

