/**
 * Get Bonus Use Case.
 * Handles the business logic for retrieving a single bonus by its ID.
 * @class GetBonusUseCase
 */
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';
import { Bonus } from '../../../domain/entities/Bonus';

/**
 * Interface for the Get Bonus Use Case request data.
 * @interface GetBonusRequest
 */
export interface GetBonusRequest {
  id: number;
}

export class GetBonusUseCase {
  /**
   * Creates an instance of GetBonusUseCase.
   * @param {IBonusRepository} bonusRepository - The bonus repository to interact with bonus data.
   */
  constructor(private bonusRepository: IBonusRepository) {}

  /**
   * Executes the bonus retrieval process.
   * @param {GetBonusRequest} request - The request containing the bonus ID.
   * @returns {Promise<Bonus | null>} A promise that resolves to the Bonus object if found, otherwise null.
   * @throws {Error} If the bonus ID is invalid.
   */
  async execute(request: GetBonusRequest): Promise<Bonus | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid bonus ID.');
    }

    return this.bonusRepository.findById(request.id);
  }
}

