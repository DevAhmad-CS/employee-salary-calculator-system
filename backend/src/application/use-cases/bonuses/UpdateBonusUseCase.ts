/**
 * Update Bonus Use Case.
 * Handles the business logic for updating an existing bonus's information.
 * @class UpdateBonusUseCase
 */
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';
import { Bonus } from '../../../domain/entities/Bonus';

/**
 * Interface for the Update Bonus Use Case request data.
 * @interface UpdateBonusRequest
 */
export interface UpdateBonusRequest {
  id: number;
  type?: string;
  amount?: number;
}

export class UpdateBonusUseCase {
  /**
   * Creates an instance of UpdateBonusUseCase.
   * @param {IBonusRepository} bonusRepository - The bonus repository to interact with bonus data.
   */
  constructor(private bonusRepository: IBonusRepository) {}

  /**
   * Executes the bonus update process.
   * @param {UpdateBonusRequest} request - The request containing the bonus ID and data to update.
   * @returns {Promise<Bonus | null>} A promise that resolves to the updated Bonus object if found, otherwise null.
   * @throws {Error} If validation fails, bonus not found, or update encounters an error.
   */
  async execute(request: UpdateBonusRequest): Promise<Bonus | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid bonus ID.');
    }

    const existingBonus = await this.bonusRepository.findById(request.id);
    if (!existingBonus) {
      throw new Error('Bonus not found.');
    }

    // Prepare data for update
    const updateData: Partial<Omit<Bonus, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>> = {};
    
    if (request.type !== undefined) {
      if (request.type.trim() === '') {
        throw new Error('Bonus type cannot be empty.');
      }
      updateData.type = request.type.trim();
    }
    
    if (request.amount !== undefined) {
      if (request.amount < 0) {
        throw new Error('Bonus amount cannot be negative.');
      }
      updateData.amount = request.amount;
    }

    if (Object.keys(updateData).length === 0) {
      return existingBonus; // No fields to update
    }

    return this.bonusRepository.update(request.id, updateData);
  }
}

