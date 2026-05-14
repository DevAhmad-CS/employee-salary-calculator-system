/**
 * Delete Deduction Use Case.
 * Handles the business logic for deleting a deduction by its ID.
 * @class DeleteDeductionUseCase
 */
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';

/**
 * Interface for the Delete Deduction Use Case request data.
 * @interface DeleteDeductionRequest
 */
export interface DeleteDeductionRequest {
  id: number;
}

export class DeleteDeductionUseCase {
  /**
   * Creates an instance of DeleteDeductionUseCase.
   * @param {IDeductionRepository} deductionRepository - The deduction repository to interact with deduction data.
   */
  constructor(private deductionRepository: IDeductionRepository) {}

  /**
   * Executes the deduction deletion process.
   * @param {DeleteDeductionRequest} request - The request containing the deduction ID to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the deduction was deleted, otherwise false.
   * @throws {Error} If the deduction ID is invalid or deletion encounters an error.
   */
  async execute(request: DeleteDeductionRequest): Promise<boolean> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid deduction ID.');
    }

    const isDeleted = await this.deductionRepository.delete(request.id);
    if (!isDeleted) {
      throw new Error('Deduction not found or could not be deleted.');
    }
    return isDeleted;
  }
}

