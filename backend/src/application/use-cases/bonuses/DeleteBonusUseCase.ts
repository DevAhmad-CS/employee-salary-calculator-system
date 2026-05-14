/**
 * Delete Bonus Use Case.
 * Handles the business logic for deleting a bonus by its ID.
 * @class DeleteBonusUseCase
 */
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';

/**
 * Interface for the Delete Bonus Use Case request data.
 * @interface DeleteBonusRequest
 */
export interface DeleteBonusRequest {
  id: number;
}

export class DeleteBonusUseCase {
  /**
   * Creates an instance of DeleteBonusUseCase.
   * @param {IBonusRepository} bonusRepository - The bonus repository to interact with bonus data.
   */
  constructor(private bonusRepository: IBonusRepository) {}

  /**
   * Executes the bonus deletion process.
   * @param {DeleteBonusRequest} request - The request containing the bonus ID to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the bonus was deleted, otherwise false.
   * @throws {Error} If the bonus ID is invalid or deletion encounters an error.
   */
  async execute(request: DeleteBonusRequest): Promise<boolean> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid bonus ID.');
    }

    const isDeleted = await this.bonusRepository.delete(request.id);
    if (!isDeleted) {
      throw new Error('Bonus not found or could not be deleted.');
    }
    return isDeleted;
  }
}

