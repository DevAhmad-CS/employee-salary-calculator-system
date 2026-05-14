/**
 * Change User Role Use Case
 * 
 * This use case handles changing a user's role (admin only).
 * 
 * @module application/use-cases/profile/ChangeUserRoleUseCase
 */

import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { UserWithoutPassword } from '../../../domain/entities/User';

/**
 * Interface for change role request.
 * @interface ChangeUserRoleRequest
 */
export interface ChangeUserRoleRequest {
  targetUserId: number;
  newRole: 'Admin' | 'Accountant' | 'Employee' | 'Management';
}

/**
 * Use case for changing a user's role.
 */
export class ChangeUserRoleUseCase {
  /**
   * Creates an instance of ChangeUserRoleUseCase.
   * @param {IUserRepository} userRepository - The user repository to update user data.
   */
  constructor(private userRepository: IUserRepository) {}

  /**
   * Executes the change role process.
   * @param {number} adminUserId - The ID of the admin performing the action.
   * @param {ChangeUserRoleRequest} request - The request containing target user ID and new role.
   * @returns {Promise<UserWithoutPassword>} A promise that resolves to the updated user.
   * @throws {Error} If admin or target user not found, or if user is not an admin.
   */
  async execute(adminUserId: number, request: ChangeUserRoleRequest): Promise<UserWithoutPassword> {
    // Validate admin user exists and is admin
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    if (adminUser.role !== 'Admin') {
      throw new Error('Only admins can change user roles');
    }

    // Validate target user exists
    const targetUser = await this.userRepository.findById(request.targetUserId);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Prevent admin from changing their own role
    if (adminUserId === request.targetUserId) {
      throw new Error('Cannot change your own role');
    }

    // Update user role
    const updatedUser = await this.userRepository.update(request.targetUserId, {
      role: request.newRole,
    });

    return updatedUser;
  }
}

