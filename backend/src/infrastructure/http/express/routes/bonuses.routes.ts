/**
 * Bonus Routes
 * 
 * This module defines all HTTP routes related to bonus management operations.
 * It uses Express Router to organize bonus endpoints and connects
 * them to the appropriate controller methods.
 * 
 * @module infrastructure/http/express/routes/bonuses.routes
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Routes handle URL mapping and delegate to controllers for request processing.
 * All routes are protected by authentication middleware.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import bonusRoutes from './routes/bonuses.routes';
 * app.use('/api/bonuses', bonusRoutes);
 * 
 * // Available endpoints:
 * // GET /api/bonuses/employee/:employeeId - Get all bonuses for an employee
 * // GET /api/bonuses/:id - Get bonus by ID
 * // POST /api/bonuses - Create new bonus
 * // PUT /api/bonuses/:id - Update bonus
 * // DELETE /api/bonuses/:id - Delete bonus
 * ```
 */

import { Router } from 'express';
import { BonusController } from '../controllers/BonusController';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Express router instance for bonus routes
 * 
 * @constant {Router}
 */
const router = Router();

/**
 * Bonus controller instance
 * 
 * Handles the business logic for bonus operations.
 * 
 * @constant {BonusController}
 */
const bonusController = new BonusController();

/**
 * Get all bonuses for an employee route
 * 
 * Retrieves all bonuses associated with a specific employee.
 * 
 * @route GET /employee/:employeeId
 * @access Protected (requires authentication)
 * @param {number} employeeId - Employee ID
 * @see BonusController.getByEmployeeId
 */
router.get('/employee/:employeeId', authenticate, bonusController.getByEmployeeId);

/**
 * Get bonus by ID route
 * 
 * Retrieves a single bonus by its ID.
 * 
 * @route GET /:id
 * @access Protected (requires authentication)
 * @param {number} id - Bonus ID
 * @see BonusController.getById
 */
router.get('/:id', authenticate, bonusController.getById);

/**
 * Create bonus route
 * 
 * Creates a new bonus for an employee.
 * 
 * @route POST /
 * @access Protected (requires authentication)
 * @see BonusController.create
 */
router.post('/', authenticate, bonusController.create);

/**
 * Update bonus route
 * 
 * Updates an existing bonus's information.
 * 
 * @route PUT /:id
 * @access Protected (requires authentication)
 * @param {number} id - Bonus ID
 * @see BonusController.update
 */
router.put('/:id', authenticate, bonusController.update);

/**
 * Delete bonus route
 * 
 * Deletes a bonus from the database.
 * 
 * @route DELETE /:id
 * @access Protected (requires authentication)
 * @param {number} id - Bonus ID
 * @see BonusController.delete
 */
router.delete('/:id', authenticate, bonusController.delete);

/**
 * Default export of the bonus router
 * 
 * This router can be mounted on the main Express app at a specific path.
 * Example: app.use('/api/bonuses', bonusRoutes)
 */
export default router;

