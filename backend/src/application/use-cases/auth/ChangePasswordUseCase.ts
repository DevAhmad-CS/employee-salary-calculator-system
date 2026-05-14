/**
 * Change Password Use Case
 * 
 * This module implements the change password business logic following Clean Architecture principles.
 * It handles password changes by verifying the old password and updating to a new password.
 * 
 * @module application/use-cases/auth/ChangePasswordUseCase
 * 
 * @remarks
 * This is part of the Application Layer (Use Cases) in Clean Architecture.
 * It orchestrates domain logic and infrastructure dependencies without knowing
 * implementation details of data persistence.
 */

import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';

/**
 * Request payload for change password operation
 * 
 * @interface ChangePasswordRequest
 * @property {string} oldPassword - Current password (for verification)
 * @property {string} newPassword - New password to set
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Change Password Use Case Implementation
 * 
 * Handles the complete password change flow:
 * 1. Validates user exists
 * 2. Verifies old password is correct
 * 3. Validates new password requirements
 * 4. Hashes new password
 * 5. Updates password in database
 * 
 * @class ChangePasswordUseCase
 */
export class ChangePasswordUseCase {
  /**
   * Creates a new instance of ChangePasswordUseCase
   * 
   * @param {IUserRepository} userRepository - Repository for user data access
   */
  constructor(private userRepository: IUserRepository) {}

  /**
   * Executes the change password use case
   * 
   * Performs the complete password change flow:
   * 1. Retrieves user with password hash
   * 2. Validates user exists
   * 3. Verifies old password is correct
   * 4. Validates new password (minimum length, not same as old)
   * 5. Hashes new password using bcrypt
   * 6. Updates password in database
   * 
   * @param {number} userId - The ID of the user changing password
   * @param {ChangePasswordRequest} request - Password change data
   * @returns {Promise<boolean>} True if password was changed successfully
   * @throws {Error} If user not found, old password incorrect, or validation fails
   * 
   * @example
   * ```typescript
   * const changePasswordUseCase = new ChangePasswordUseCase(userRepository);
   * 
   * try {
   *   await changePasswordUseCase.execute(123, {
   *     oldPassword: 'oldPassword123',
   *     newPassword: 'newPassword456'
   *   });
   * } catch (error) {
   *   // Handle error
   * }
   * ```
   */
  async execute(userId: number, request: ChangePasswordRequest): Promise<boolean> {
    // Step 1: Find user by ID (need password hash for verification)
    // We need to get the user with password hash, so we'll use findByUsername after getting user
    const userWithoutPassword = await this.userRepository.findById(userId);
    if (!userWithoutPassword) {
      throw new Error('User not found');
    }

    // Get user with password hash for verification
    const user = await this.userRepository.findByUsername(userWithoutPassword.username);
    if (!user) {
      throw new Error('User not found');
    }

    // Step 2: Verify old password
    const isOldPasswordValid = await bcrypt.compare(request.oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Step 3: Validate new password
    if (!request.newPassword || request.newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Step 4: Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(request.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Step 5: Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(request.newPassword, saltRounds);

    // Step 6: Update password in database
    const success = await this.userRepository.updatePassword(userId, newPasswordHash);
    if (!success) {
      throw new Error('Failed to update password');
    }

    return true;
  }
}

