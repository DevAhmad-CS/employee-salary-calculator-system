/**
 * Profile Controller
 * 
 * Handles HTTP requests related to user profile management.
 * This controller is responsible for processing profile-related API endpoints.
 */

import { Request, Response } from 'express';
import { UpdateProfileUseCase, UpdateProfileRequest } from '../../../../application/use-cases/auth/UpdateProfileUseCase';
import { ChangePasswordUseCase, ChangePasswordRequest } from '../../../../application/use-cases/auth/ChangePasswordUseCase';
import { UpdateUserPreferencesUseCase, UpdateUserPreferencesRequest } from '../../../../application/use-cases/profile/UpdateUserPreferencesUseCase';
import { ForceLogoutUserUseCase, ForceLogoutRequest } from '../../../../application/use-cases/profile/ForceLogoutUserUseCase';
import { ChangeUserRoleUseCase, ChangeUserRoleRequest } from '../../../../application/use-cases/profile/ChangeUserRoleUseCase';
import { IUserRepository } from '../../../../domain/interfaces/IUserRepository';
import { IEmployeeRepository } from '../../../../domain/interfaces/IEmployeeRepository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Profile Controller class
 * 
 * Handles all profile-related HTTP requests including:
 * - Getting current user profile
 * - Updating user profile
 * - Changing user password
 */
export class ProfileController {
  private updateProfileUseCase: UpdateProfileUseCase;
  private changePasswordUseCase: ChangePasswordUseCase;
  private updateUserPreferencesUseCase: UpdateUserPreferencesUseCase;
  private forceLogoutUserUseCase: ForceLogoutUserUseCase;
  private changeUserRoleUseCase: ChangeUserRoleUseCase;
  private userRepository: IUserRepository;
  private employeeRepository: IEmployeeRepository;

  /**
   * Creates an instance of ProfileController.
   * 
   * @param {IUserRepository} userRepository - Repository for user data access
   * @param {IEmployeeRepository} employeeRepository - Repository for employee data access
   */
  constructor(userRepository: IUserRepository, employeeRepository: IEmployeeRepository) {
    this.userRepository = userRepository;
    this.employeeRepository = employeeRepository;
    this.updateProfileUseCase = new UpdateProfileUseCase(userRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(userRepository);
    this.updateUserPreferencesUseCase = new UpdateUserPreferencesUseCase(userRepository);
    this.forceLogoutUserUseCase = new ForceLogoutUserUseCase(userRepository);
    this.changeUserRoleUseCase = new ChangeUserRoleUseCase(userRepository);
  }

  /**
   * Gets the current user's profile information.
   * 
   * GET /api/profile
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const user = await this.userRepository.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Get employee email if employeeId exists
      let email: string | null = null;
      if (user.employeeId) {
        try {
          const employee = await this.employeeRepository.findById(user.employeeId);
          if (employee && employee.email) {
            email = employee.email;
          }
        } catch (error) {
          // If employee not found, email remains null
          console.error('Error fetching employee email:', error);
        }
      }

      // Return user data with email
      res.status(200).json({
        success: true,
        data: {
          ...user,
          email: email || null,
        },
      });
    } catch (error: any) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profile',
      });
    }
  }

  /**
   * Updates the current user's profile information.
   * 
   * PUT /api/profile
   * 
   * Request body:
   * {
   *   username?: string,
   *   role?: 'Admin' | 'Accountant' | 'Employee' | 'Management',
   *   employeeId?: number | null
   * }
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { username, role, employeeId } = req.body;

      // Build update request
      const updateRequest: UpdateProfileRequest = {};
      if (username !== undefined) {
        updateRequest.username = username;
      }
      if (role !== undefined) {
        updateRequest.role = role;
      }
      if (employeeId !== undefined) {
        updateRequest.employeeId = employeeId === null ? null : parseInt(employeeId);
      }

      // Update profile
      const updatedUser = await this.updateProfileUseCase.execute(userId, updateRequest);

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Username already exists') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * Changes the current user's password.
   * 
   * POST /api/profile/change-password
   * 
   * Request body:
   * {
   *   oldPassword: string,
   *   newPassword: string
   * }
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      // Validate required fields
      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Old password and new password are required',
        });
        return;
      }

      // Build change password request
      const changePasswordRequest: ChangePasswordRequest = {
        oldPassword,
        newPassword,
      };

      // Change password
      await this.changePasswordUseCase.execute(userId, changePasswordRequest);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message === 'Current password is incorrect') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * Gets the current user's preferences.
   * 
   * GET /api/profile/preferences
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const preferences = await this.updateUserPreferencesUseCase.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error: any) {
      console.error('Error getting preferences:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get preferences',
      });
    }
  }

  /**
   * Updates the current user's preferences.
   * 
   * PUT /api/profile/preferences
   * 
   * Request body:
   * {
   *   dateFormat?: string,
   *   currencyFormat?: string,
   *   autoLogoutTimeout?: number
   * }
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { dateFormat, currencyFormat, autoLogoutTimeout } = req.body;

      const updateRequest: UpdateUserPreferencesRequest = {};
      if (dateFormat !== undefined) {
        updateRequest.dateFormat = dateFormat;
      }
      if (currencyFormat !== undefined) {
        updateRequest.currencyFormat = currencyFormat;
      }
      if (autoLogoutTimeout !== undefined) {
        updateRequest.autoLogoutTimeout = parseInt(autoLogoutTimeout);
      }

      const preferences = await this.updateUserPreferencesUseCase.execute(userId, updateRequest);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update preferences',
      });
    }
  }

  /**
   * Forces logout for a user (admin only).
   * 
   * POST /api/profile/force-logout
   * 
   * Request body:
   * {
   *   targetUserId: number
   * }
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async forceLogout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { targetUserId } = req.body;

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          error: 'Target user ID is required',
        });
        return;
      }

      const forceLogoutRequest: ForceLogoutRequest = {
        targetUserId: parseInt(targetUserId),
      };

      await this.forceLogoutUserUseCase.execute(adminUserId, forceLogoutRequest);

      res.status(200).json({
        success: true,
        message: 'User logged out successfully',
      });
    } catch (error: any) {
      console.error('Error forcing logout:', error);
      
      if (error.message === 'Only admins can force logout users') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to force logout user',
      });
    }
  }

  /**
   * Changes a user's role (admin only).
   * 
   * POST /api/profile/change-role
   * 
   * Request body:
   * {
   *   targetUserId: number,
   *   newRole: 'Admin' | 'Accountant' | 'Employee' | 'Management'
   * }
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async changeRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { targetUserId, newRole } = req.body;

      if (!targetUserId || !newRole) {
        res.status(400).json({
          success: false,
          error: 'Target user ID and new role are required',
        });
        return;
      }

      const changeRoleRequest: ChangeUserRoleRequest = {
        targetUserId: parseInt(targetUserId),
        newRole,
      };

      const updatedUser = await this.changeUserRoleUseCase.execute(adminUserId, changeRoleRequest);

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User role changed successfully',
      });
    } catch (error: any) {
      console.error('Error changing role:', error);
      
      if (error.message === 'Only admins can change user roles') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change user role',
      });
    }
  }
}

