/**
 * Get Deduction Use Case.
 * Handles the business logic for retrieving a single deduction by its ID.
 * @class GetDeductionUseCase
 */
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';
import { Deduction } from '../../../domain/entities/Deduction';

/**
 * Interface for the Get Deduction Use Case request data.
 * @interface GetDeductionRequest
 */
export interface GetDeductionRequest {
  id: number;
}

export class GetDeductionUseCase {
  /**
   * Creates an instance of GetDeductionUseCase.
   * @param {IDeductionRepository} deductionRepository - The deduction repository to interact with deduction data.
   */
  constructor(private deductionRepository: IDeductionRepository) {}

  /**
   * Executes the deduction retrieval process.
   * @param {GetDeductionRequest} request - The request containing the deduction ID.
   * @returns {Promise<Deduction | null>} A promise that resolves to the Deduction object if found, otherwise null.
   * @throws {Error} If the deduction ID is invalid.
   */
  async execute(request: GetDeductionRequest): Promise<Deduction | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid deduction ID.');
    }

    return this.deductionRepository.findById(request.id);
  }
}

