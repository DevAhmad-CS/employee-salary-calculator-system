/**
 * Update Profile Use Case
 * 
 * This module implements the update profile business logic following Clean Architecture principles.
 * It handles updating user profile information (username, role, employeeId).
 * 
 * @module application/use-cases/auth/UpdateProfileUseCase
 * 
 * @remarks
 * This is part of the Application Layer (Use Cases) in Clean Architecture.
 * It orchestrates domain logic and infrastructure dependencies without knowing
 * implementation details of data persistence.
 */

import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { UserWithoutPassword } from '../../../domain/entities/User';

/**
 * Request payload for update profile operation
 * 
 * @interface UpdateProfileRequest
 * @property {string} [username] - New username (must be unique)
 * @property {'Admin' | 'Accountant' | 'Employee' | 'Management'} [role] - New role
 * @property {number | null} [employeeId] - New employee ID
 */
export interface UpdateProfileRequest {
  username?: string;
  role?: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  employeeId?: number | null;
}

/**
 * Update Profile Use Case Implementation
 * 
 * Handles the complete profile update flow:
 * 1. Validates user exists
 * 2. Validates username uniqueness (if username is being updated)
 * 3. Updates user profile information
 * 4. Returns updated user information
 * 
 * @class UpdateProfileUseCase
 */
export class UpdateProfileUseCase {
  /**
   * Creates a new instance of UpdateProfileUseCase
   * 
   * @param {IUserRepository} userRepository - Repository for user data access
   */
  constructor(private userRepository: IUserRepository) {}

  /**
   * Executes the update profile use case
   * 
   * Performs the complete profile update flow:
   * 1. Validates user exists
   * 2. Validates username uniqueness if username is being updated
   * 3. Updates user profile
   * 4. Returns updated user data
   * 
   * @param {number} userId - The ID of the user to update
   * @param {UpdateProfileRequest} request - Profile update data
   * @returns {Promise<UserWithoutPassword>} Updated user information without password
   * @throws {Error} If user not found, username already exists, or validation fails
   * 
   * @example
   * ```typescript
   * const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
   * 
   * try {
   *   const updatedUser = await updateProfileUseCase.execute(123, {
   *     username: 'new_username',
   *     role: 'Admin'
   *   });
   * } catch (error) {
   *   // Handle error
   * }
   * ```
   */
  async execute(userId: number, request: UpdateProfileRequest): Promise<UserWithoutPassword> {
    // Validate user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate username uniqueness if username is being updated
    if (request.username && request.username !== existingUser.username) {
      const userWithSameUsername = await this.userRepository.findByUsername(request.username);
      if (userWithSameUsername && userWithSameUsername.id !== userId) {
        throw new Error('Username already exists');
      }
    }

    // Build update data object (only include provided fields)
    const updateData: Partial<{
      username: string;
      role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
      employeeId: number | null;
    }> = {};

    if (request.username !== undefined) {
      updateData.username = request.username.trim();
    }

    if (request.role !== undefined) {
      updateData.role = request.role;
    }

    if (request.employeeId !== undefined) {
      updateData.employeeId = request.employeeId;
    }

    // Update user profile
    const updatedUser = await this.userRepository.update(userId, updateData);
    return updatedUser;
  }
}

