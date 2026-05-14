/**
 * Force Logout User Use Case
 * 
 * This use case handles forcing a user logout (admin only).
 * 
 * @module application/use-cases/profile/ForceLogoutUserUseCase
 */

import { IUserRepository } from '../../../domain/interfaces/IUserRepository';

/**
 * Interface for force logout request.
 * @interface ForceLogoutRequest
 */
export interface ForceLogoutRequest {
  targetUserId: number;
}

/**
 * Use case for forcing a user logout.
 * 
 * Note: This is a simplified implementation. In a production system,
 * you would typically invalidate JWT tokens or maintain a blacklist.
 * For now, this is a placeholder that can be extended later.
 */
export class ForceLogoutUserUseCase {
  /**
   * Creates an instance of ForceLogoutUserUseCase.
   * @param {IUserRepository} userRepository - The user repository to get user data.
   */
  constructor(private userRepository: IUserRepository) {}

  /**
   * Executes the force logout process.
   * @param {number} adminUserId - The ID of the admin performing the action.
   * @param {ForceLogoutRequest} request - The request containing target user ID.
   * @returns {Promise<void>} A promise that resolves when logout is forced.
   * @throws {Error} If admin or target user not found, or if user is not an admin.
   */
  async execute(adminUserId: number, request: ForceLogoutRequest): Promise<void> {
    // Validate admin user exists and is admin
    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    if (adminUser.role !== 'Admin') {
      throw new Error('Only admins can force logout users');
    }

    // Validate target user exists
    const targetUser = await this.userRepository.findById(request.targetUserId);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // TODO: In a production system, invalidate JWT tokens or maintain a blacklist
    // For now, this is a placeholder
    console.log(`Admin ${adminUser.username} forced logout for user ${targetUser.username}`);
  }
}

