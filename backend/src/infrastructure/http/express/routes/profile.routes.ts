/**
 * Profile Routes
 * 
 * Defines all API routes related to user profile management.
 * All routes are protected by authentication middleware.
 */

import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { UserRepository } from '../../../database/repositories/UserRepository';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Initialize repositories
const userRepository = new UserRepository();
const employeeRepository = new EmployeeRepository();

// Initialize controller
const profileController = new ProfileController(userRepository, employeeRepository);

/**
 * GET /api/profile
 * 
 * Get the current user's profile information.
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: number,
 *     username: string,
 *     role: string,
 *     employeeId: number | null,
 *     createdAt: Date,
 *     updatedAt: Date
 *   }
 * }
 */
router.get('/', authenticate, (req, res) => {
  profileController.getProfile(req, res);
});

/**
 * PUT /api/profile
 * 
 * Update the current user's profile information.
 * 
 * Request body:
 * {
 *   username?: string,
 *   role?: 'Admin' | 'Accountant' | 'Employee' | 'Management',
 *   employeeId?: number | null
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: number,
 *     username: string,
 *     role: string,
 *     employeeId: number | null,
 *     createdAt: Date,
 *     updatedAt: Date
 *   }
 * }
 */
router.put('/', authenticate, (req, res) => {
  profileController.updateProfile(req, res);
});

/**
 * POST /api/profile/change-password
 * 
 * Change the current user's password.
 * 
 * Request body:
 * {
 *   oldPassword: string,
 *   newPassword: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: 'Password changed successfully'
 * }
 */
router.post('/change-password', authenticate, (req, res) => {
  profileController.changePassword(req, res);
});

/**
 * GET /api/profile/preferences
 * 
 * Get the current user's preferences.
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     dateFormat: string,
 *     currencyFormat: string,
 *     autoLogoutTimeout: number
 *   }
 * }
 */
router.get('/preferences', authenticate, (req, res) => {
  profileController.getPreferences(req, res);
});

/**
 * PUT /api/profile/preferences
 * 
 * Update the current user's preferences.
 * 
 * Request body:
 * {
 *   dateFormat?: string,
 *   currencyFormat?: string,
 *   autoLogoutTimeout?: number
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     dateFormat: string,
 *     currencyFormat: string,
 *     autoLogoutTimeout: number
 *   }
 * }
 */
router.put('/preferences', authenticate, (req, res) => {
  profileController.updatePreferences(req, res);
});

/**
 * POST /api/profile/force-logout
 * 
 * Force logout for a user (admin only).
 * 
 * Request body:
 * {
 *   targetUserId: number
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: 'User logged out successfully'
 * }
 */
router.post('/force-logout', authenticate, (req, res) => {
  profileController.forceLogout(req, res);
});

/**
 * POST /api/profile/change-role
 * 
 * Change a user's role (admin only).
 * 
 * Request body:
 * {
 *   targetUserId: number,
 *   newRole: 'Admin' | 'Accountant' | 'Employee' | 'Management'
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: number,
 *     username: string,
 *     role: string,
 *     employeeId: number | null,
 *     createdAt: Date,
 *     updatedAt: Date
 *   },
 *   message: 'User role changed successfully'
 * }
 */
router.post('/change-role', authenticate, (req, res) => {
  profileController.changeRole(req, res);
});

export default router;

