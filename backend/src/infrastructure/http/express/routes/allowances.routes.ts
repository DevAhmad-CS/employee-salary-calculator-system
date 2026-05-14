/**
 * Allowance Routes
 * 
 * This module defines all HTTP routes related to allowance management operations.
 * It uses Express Router to organize allowance endpoints and connects
 * them to the appropriate controller methods.
 * 
 * @module infrastructure/http/express/routes/allowances.routes
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Routes handle URL mapping and delegate to controllers for request processing.
 * All routes are protected by authentication middleware.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import allowanceRoutes from './routes/allowances.routes';
 * app.use('/api/allowances', allowanceRoutes);
 * 
 * // Available endpoints:
 * // GET /api/allowances/employee/:employeeId - Get all allowances for an employee
 * // GET /api/allowances/:id - Get allowance by ID
 * // POST /api/allowances - Create new allowance
 * // PUT /api/allowances/:id - Update allowance
 * // DELETE /api/allowances/:id - Delete allowance
 * ```
 */

import { Router } from 'express';
import { AllowanceController } from '../controllers/AllowanceController';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Express router instance for allowance routes
 * 
 * @constant {Router}
 */
const router = Router();

/**
 * Allowance controller instance
 * 
 * Handles the business logic for allowance operations.
 * 
 * @constant {AllowanceController}
 */
const allowanceController = new AllowanceController();

/**
 * Get all allowances for an employee route
 * 
 * Retrieves all allowances associated with a specific employee.
 * 
 * @route GET /employee/:employeeId
 * @access Protected (requires authentication)
 * @param {number} employeeId - Employee ID
 * @see AllowanceController.getByEmployeeId
 */
router.get('/employee/:employeeId', authenticate, allowanceController.getByEmployeeId);

/**
 * Get allowance by ID route
 * 
 * Retrieves a single allowance by its ID.
 * 
 * @route GET /:id
 * @access Protected (requires authentication)
 * @param {number} id - Allowance ID
 * @see AllowanceController.getById
 */
router.get('/:id', authenticate, allowanceController.getById);

/**
 * Create allowance route
 * 
 * Creates a new allowance for an employee.
 * 
 * @route POST /
 * @access Protected (requires authentication)
 * @see AllowanceController.create
 */
router.post('/', authenticate, allowanceController.create);

/**
 * Update allowance route
 * 
 * Updates an existing allowance's information.
 * 
 * @route PUT /:id
 * @access Protected (requires authentication)
 * @param {number} id - Allowance ID
 * @see AllowanceController.update
 */
router.put('/:id', authenticate, allowanceController.update);

/**
 * Delete allowance route
 * 
 * Deletes an allowance from the database.
 * 
 * @route DELETE /:id
 * @access Protected (requires authentication)
 * @param {number} id - Allowance ID
 * @see AllowanceController.delete
 */
router.delete('/:id', authenticate, allowanceController.delete);

/**
 * Default export of the allowance router
 * 
 * This router can be mounted on the main Express app at a specific path.
 * Example: app.use('/api/allowances', allowanceRoutes)
 */
export default router;

