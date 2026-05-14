/**
 * Deduction Routes
 * 
 * This module defines all HTTP routes related to deduction management operations.
 * It uses Express Router to organize deduction endpoints and connects
 * them to the appropriate controller methods.
 * 
 * @module infrastructure/http/express/routes/deductions.routes
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Routes handle URL mapping and delegate to controllers for request processing.
 * All routes are protected by authentication middleware.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import deductionRoutes from './routes/deductions.routes';
 * app.use('/api/deductions', deductionRoutes);
 * 
 * // Available endpoints:
 * // GET /api/deductions/employee/:employeeId - Get all deductions for an employee
 * // GET /api/deductions/:id - Get deduction by ID
 * // POST /api/deductions - Create new deduction
 * // PUT /api/deductions/:id - Update deduction
 * // DELETE /api/deductions/:id - Delete deduction
 * ```
 */

import { Router } from 'express';
import { DeductionController } from '../controllers/DeductionController';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Express router instance for deduction routes
 * 
 * @constant {Router}
 */
const router = Router();

/**
 * Deduction controller instance
 * 
 * Handles the business logic for deduction operations.
 * 
 * @constant {DeductionController}
 */
const deductionController = new DeductionController();

/**
 * Get all deductions for an employee route
 * 
 * Retrieves all deductions associated with a specific employee.
 * 
 * @route GET /employee/:employeeId
 * @access Protected (requires authentication)
 * @param {number} employeeId - Employee ID
 * @see DeductionController.getByEmployeeId
 */
router.get('/employee/:employeeId', authenticate, deductionController.getByEmployeeId);

/**
 * Get deduction by ID route
 * 
 * Retrieves a single deduction by its ID.
 * 
 * @route GET /:id
 * @access Protected (requires authentication)
 * @param {number} id - Deduction ID
 * @see DeductionController.getById
 */
router.get('/:id', authenticate, deductionController.getById);

/**
 * Create deduction route
 * 
 * Creates a new deduction for an employee.
 * 
 * @route POST /
 * @access Protected (requires authentication)
 * @see DeductionController.create
 */
router.post('/', authenticate, deductionController.create);

/**
 * Update deduction route
 * 
 * Updates an existing deduction's information.
 * 
 * @route PUT /:id
 * @access Protected (requires authentication)
 * @param {number} id - Deduction ID
 * @see DeductionController.update
 */
router.put('/:id', authenticate, deductionController.update);

/**
 * Delete deduction route
 * 
 * Deletes a deduction from the database.
 * 
 * @route DELETE /:id
 * @access Protected (requires authentication)
 * @param {number} id - Deduction ID
 * @see DeductionController.delete
 */
router.delete('/:id', authenticate, deductionController.delete);

/**
 * Default export of the deduction router
 * 
 * This router can be mounted on the main Express app at a specific path.
 * Example: app.use('/api/deductions', deductionRoutes)
 */
export default router;

