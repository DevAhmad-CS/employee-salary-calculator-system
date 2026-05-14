/**
 * Get Salary Slips Use Case.
 * Handles the business logic for retrieving salary slips with optional filters.
 * @class GetSalarySlipsUseCase
 */
import { ISalarySlipRepository } from '../../../domain/interfaces/ISalarySlipRepository';
import { SalarySlip } from '../../../domain/entities/SalarySlip';

/**
 * Interface for the Get Salary Slips Use Case request data.
 * @interface GetSalarySlipsRequest
 */
export interface GetSalarySlipsRequest {
  employeeId?: number;
  month?: number;
  year?: number;
}

export class GetSalarySlipsUseCase {
  /**
   * Creates an instance of GetSalarySlipsUseCase.
   * @param {ISalarySlipRepository} salarySlipRepository - The salary slip repository to interact with salary slip data.
   */
  constructor(private salarySlipRepository: ISalarySlipRepository) {}

  /**
   * Executes the salary slips retrieval process.
   * @param {GetSalarySlipsRequest} request - The request containing optional filters.
   * @returns {Promise<SalarySlip[]>} A promise that resolves to an array of SalarySlip objects.
   * @throws {Error} If retrieval encounters an error.
   */
  async execute(request: GetSalarySlipsRequest): Promise<SalarySlip[]> {
    // If employeeId is provided, get all slips for that employee
    if (request.employeeId) {
      return this.salarySlipRepository.findByEmployeeId(request.employeeId);
    }

    // If month and year are provided, get slips for that month/year
    if (request.month && request.year) {
      return this.salarySlipRepository.findByMonthYear(request.month, request.year);
    }

    // If no filters, return empty array (or could throw error)
    // For now, we'll require at least one filter
    throw new Error('At least one filter (employeeId, or month and year) must be provided.');
  }
}

