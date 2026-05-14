/**
 * Delete Allowance Use Case.
 * Handles the business logic for deleting an allowance by its ID.
 * @class DeleteAllowanceUseCase
 */
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';

/**
 * Interface for the Delete Allowance Use Case request data.
 * @interface DeleteAllowanceRequest
 */
export interface DeleteAllowanceRequest {
  id: number;
}

export class DeleteAllowanceUseCase {
  /**
   * Creates an instance of DeleteAllowanceUseCase.
   * @param {IAllowanceRepository} allowanceRepository - The allowance repository to interact with allowance data.
   */
  constructor(private allowanceRepository: IAllowanceRepository) {}

  /**
   * Executes the allowance deletion process.
   * @param {DeleteAllowanceRequest} request - The request containing the allowance ID to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the allowance was deleted, otherwise false.
   * @throws {Error} If the allowance ID is invalid or deletion encounters an error.
   */
  async execute(request: DeleteAllowanceRequest): Promise<boolean> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid allowance ID.');
    }

    const isDeleted = await this.allowanceRepository.delete(request.id);
    if (!isDeleted) {
      throw new Error('Allowance not found or could not be deleted.');
    }
    return isDeleted;
  }
}

