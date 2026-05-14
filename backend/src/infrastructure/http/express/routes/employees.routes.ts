/**
 * Employee Routes
 * 
 * This module defines all HTTP routes related to employee management operations.
 * It uses Express Router to organize employee endpoints and connects
 * them to the appropriate controller methods.
 * 
 * @module infrastructure/http/express/routes/employees.routes
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Routes handle URL mapping and delegate to controllers for request processing.
 * All routes are protected by authentication middleware.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import employeeRoutes from './routes/employees.routes';
 * app.use('/api/employees', employeeRoutes);
 * 
 * // Available endpoints:
 * // GET /api/employees - Get all employees (with pagination, search, filter)
 * // GET /api/employees/:id - Get employee by ID
 * // POST /api/employees - Create new employee
 * // PUT /api/employees/:id - Update employee
 * // DELETE /api/employees/:id - Delete employee
 * // POST /api/employees/:id/account - Create login account for employee (admin only)
 * // PUT /api/employees/:id/account - Update login account for employee (admin only)
 * ```
 */

import { Router } from 'express';
import { EmployeeController } from '../controllers/EmployeeController';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Express router instance for employee routes
 * 
 * @constant {Router}
 */
const router = Router();

/**
 * Employee controller instance
 * 
 * Handles the business logic for employee operations.
 * 
 * @constant {EmployeeController}
 */
const employeeController = new EmployeeController();

/**
 * Get all employees route
 * 
 * Retrieves a list of employees with optional filtering and pagination.
 * Supports query parameters: search, department, status, page, limit
 * 
 * @route GET /
 * @access Protected (requires authentication)
 * @see EmployeeController.getAll
 */
router.get('/', authenticate, employeeController.getAll);

/**
 * Get employee by ID route
 * 
 * Retrieves a single employee by their ID.
 * 
 * @route GET /:id
 * @access Protected (requires authentication)
 * @param {number} id - Employee ID
 * @see EmployeeController.getById
 */
router.get('/:id', authenticate, employeeController.getById);

/**
 * Create employee route
 * 
 * Creates a new employee in the database.
 * 
 * @route POST /
 * @access Protected (requires authentication)
 * @see EmployeeController.create
 */
router.post('/', authenticate, employeeController.create);

/**
 * Update employee route
 * 
 * Updates an existing employee's information.
 * 
 * @route PUT /:id
 * @access Protected (requires authentication)
 * @param {number} id - Employee ID
 * @see EmployeeController.update
 */
router.put('/:id', authenticate, employeeController.update);

/**
 * Delete employee route
 * 
 * Deletes an employee from the database.
 * 
 * @route DELETE /:id
 * @access Protected (requires authentication)
 * @param {number} id - Employee ID
 * @see EmployeeController.delete
 */
router.delete('/:id', authenticate, employeeController.delete);

/**
 * Create employee account route
 * 
 * Creates a login account for a specific employee (admin only).
 * 
 * @route POST /:id/account
 * @access Protected (requires authentication)
 * @param {number} id - Employee ID
 * @see EmployeeController.createAccount
 */
router.post('/:id/account', authenticate, employeeController.createAccount);

/**
 * Update employee account route
 *
 * Updates login account for a specific employee (admin only).
 *
 * @route PUT /:id/account
 * @access Protected (requires authentication)
 * @param {number} id - Employee ID
 * @see EmployeeController.updateAccount
 */
router.put('/:id/account', authenticate, employeeController.updateAccount);

/**
 * Default export of the employee router
 * 
 * This router can be mounted on the main Express app at a specific path.
 * Example: app.use('/api/employees', employeeRoutes)
 */
export default router;

