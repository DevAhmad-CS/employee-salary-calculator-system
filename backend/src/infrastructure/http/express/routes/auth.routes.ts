/**
 * Authentication Routes
 * 
 * This module defines all HTTP routes related to authentication operations.
 * It uses Express Router to organize authentication endpoints and connects
 * them to the appropriate controller methods.
 * 
 * @module infrastructure/http/express/routes/auth.routes
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Routes handle URL mapping and delegate to controllers for request processing.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import authRoutes from './routes/auth.routes';
 * app.use('/api/auth', authRoutes);
 * 
 * // Available endpoints:
 * // POST /api/auth/login
 * ```
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Express router instance for authentication routes
 * 
 * @constant {Router}
 */
const router = Router();

/**
 * Authentication controller instance
 * 
 * Handles the business logic for authentication operations.
 * 
 * @constant {AuthController}
 */
const authController = new AuthController();

/**
 * Login route
 * 
 * Handles POST requests to authenticate a user and receive a JWT token.
 * 
 * @route POST /login
 * @access Public
 * @param {Request.body.username} username - User's username
 * @param {Request.body.password} password - User's plain text password
 * @returns {Response} JSON response with user data and JWT token
 * 
 * @example
 * ```typescript
 * // Request:
 * POST /api/auth/login
 * Content-Type: application/json
 * 
 * {
 *   "username": "john_doe",
 *   "password": "password123"
 * }
 * 
 * // Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": 1,
 *       "username": "john_doe",
 *       "role": "Employee"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 * 
 * // Error Response (400):
 * {
 *   "success": false,
 *   "error": "Username and password are required"
 * }
 * 
 * // Error Response (401):
 * {
 *   "success": false,
 *   "error": "Invalid credentials"
 * }
 * ```
 */
router.post('/login', authController.login);

/**
 * Create user account route
 * 
 * Handles POST requests to create a standalone user account (without requiring an employee).
 * Used for creating Admin, HR, Accountant, or Management accounts.
 * 
 * IMPORTANT: This route must be defined BEFORE /users/:id to avoid route matching conflicts.
 * 
 * @route POST /users
 * @access Protected (admin only)
 */
router.post('/users', authenticate, authController.createUserAccount);

/**
 * Get user by ID route
 * 
 * Handles GET requests to retrieve a user by their ID (without password).
 * 
 * @route GET /users/:id
 * @access Protected (requires authentication)
 */
router.get('/users/:id', authenticate, authController.getUserById);

/**
 * Default export of the authentication router
 * 
 * This router can be mounted on the main Express app at a specific path.
 * Example: app.use('/api/auth', authRoutes)
 */
export default router;

