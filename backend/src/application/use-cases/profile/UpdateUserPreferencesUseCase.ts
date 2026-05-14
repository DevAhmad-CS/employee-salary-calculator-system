/**
 * Update User Preferences Use Case
 * 
 * This use case handles updating user preferences such as:
 * - Date Format
 * - Currency Format
 * - Auto-logout Timeout
 * 
 * @module application/use-cases/profile/UpdateUserPreferencesUseCase
 */

import { IUserRepository } from '../../../domain/interfaces/IUserRepository';

/**
 * Interface for user preferences update request.
 * @interface UpdateUserPreferencesRequest
 */
export interface UpdateUserPreferencesRequest {
  dateFormat?: string;
  currencyFormat?: string;
  autoLogoutTimeout?: number;
}

/**
 * Interface for user preferences.
 * @interface UserPreferences
 */
export interface UserPreferences {
  dateFormat: string;
  currencyFormat: string;
  autoLogoutTimeout: number;
}

/**
 * Use case for updating user preferences.
 * 
 * Note: This is a simplified implementation. In a production system,
 * you would typically store preferences in a separate table or JSONB column.
 * For now, this is a placeholder that can be extended later.
 */
export class UpdateUserPreferencesUseCase {
  /**
   * Creates an instance of UpdateUserPreferencesUseCase.
   * @param {IUserRepository} userRepository - The user repository to get user data.
   */
  constructor(private userRepository: IUserRepository) {}

  /**
   * Executes the user preferences update process.
   * @param {number} userId - The ID of the user to update preferences for.
   * @param {UpdateUserPreferencesRequest} request - The preferences to update.
   * @returns {Promise<UserPreferences>} A promise that resolves to the updated preferences.
   * @throws {Error} If user not found or update fails.
   */
  async execute(userId: number, request: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // TODO: In a production system, store preferences in a separate table or JSONB column
    // For now, return default preferences with any updates applied
    const defaultPreferences: UserPreferences = {
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: 'USD',
      autoLogoutTimeout: 15,
    };

    // Merge with request preferences
    const updatedPreferences: UserPreferences = {
      dateFormat: request.dateFormat || defaultPreferences.dateFormat,
      currencyFormat: request.currencyFormat || defaultPreferences.currencyFormat,
      autoLogoutTimeout: request.autoLogoutTimeout || defaultPreferences.autoLogoutTimeout,
    };

    // TODO: Save preferences to database
    // await this.userRepository.updatePreferences(userId, updatedPreferences);

    return updatedPreferences;
  }

  /**
   * Gets user preferences.
   * @param {number} userId - The ID of the user to get preferences for.
   * @returns {Promise<UserPreferences>} A promise that resolves to the user preferences.
   * @throws {Error} If user not found.
   */
  async getPreferences(userId: number): Promise<UserPreferences> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // TODO: In a production system, retrieve preferences from database
    // For now, return default preferences
    return {
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: 'USD',
      autoLogoutTimeout: 15,
    };
  }
}

