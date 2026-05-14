/**
 * Get Salary Slip Use Case.
 * Handles the business logic for retrieving a single salary slip by its ID.
 * @class GetSalarySlipUseCase
 */
import { ISalarySlipRepository } from '../../../domain/interfaces/ISalarySlipRepository';
import { SalarySlip } from '../../../domain/entities/SalarySlip';

/**
 * Interface for the Get Salary Slip Use Case request data.
 * @interface GetSalarySlipRequest
 */
export interface GetSalarySlipRequest {
  id: number;
}

export class GetSalarySlipUseCase {
  /**
   * Creates an instance of GetSalarySlipUseCase.
   * @param {ISalarySlipRepository} salarySlipRepository - The salary slip repository to interact with salary slip data.
   */
  constructor(private salarySlipRepository: ISalarySlipRepository) {}

  /**
   * Executes the salary slip retrieval process.
   * @param {GetSalarySlipRequest} request - The request containing the salary slip ID.
   * @returns {Promise<SalarySlip | null>} A promise that resolves to the SalarySlip object if found, otherwise null.
   * @throws {Error} If the salary slip ID is invalid or retrieval encounters an error.
   */
  async execute(request: GetSalarySlipRequest): Promise<SalarySlip | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid salary slip ID.');
    }

    return this.salarySlipRepository.findById(request.id);
  }
}

