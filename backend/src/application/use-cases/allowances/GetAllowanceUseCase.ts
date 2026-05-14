/**
 * Get Allowance Use Case.
 * Handles the business logic for retrieving a single allowance by its ID.
 * @class GetAllowanceUseCase
 */
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';
import { Allowance } from '../../../domain/entities/Allowance';

/**
 * Interface for the Get Allowance Use Case request data.
 * @interface GetAllowanceRequest
 */
export interface GetAllowanceRequest {
  id: number;
}

export class GetAllowanceUseCase {
  /**
   * Creates an instance of GetAllowanceUseCase.
   * @param {IAllowanceRepository} allowanceRepository - The allowance repository to interact with allowance data.
   */
  constructor(private allowanceRepository: IAllowanceRepository) {}

  /**
   * Executes the allowance retrieval process.
   * @param {GetAllowanceRequest} request - The request containing the allowance ID.
   * @returns {Promise<Allowance | null>} A promise that resolves to the Allowance object if found, otherwise null.
   * @throws {Error} If the allowance ID is invalid.
   */
  async execute(request: GetAllowanceRequest): Promise<Allowance | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid allowance ID.');
    }

    return this.allowanceRepository.findById(request.id);
  }
}

