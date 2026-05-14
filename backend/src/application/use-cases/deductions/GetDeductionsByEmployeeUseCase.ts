/**
 * Get Deductions by Employee Use Case.
 * Handles the business logic for retrieving all deductions for a specific employee.
 * @class GetDeductionsByEmployeeUseCase
 */
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Deduction } from '../../../domain/entities/Deduction';

/**
 * Interface for the Get Deductions by Employee Use Case request data.
 * @interface GetDeductionsByEmployeeRequest
 */
export interface GetDeductionsByEmployeeRequest {
  employeeId: number;
}

export class GetDeductionsByEmployeeUseCase {
  /**
   * Creates an instance of GetDeductionsByEmployeeUseCase.
   * @param {IDeductionRepository} deductionRepository - The deduction repository to interact with deduction data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to verify employee existence.
   */
  constructor(
    private deductionRepository: IDeductionRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the deductions retrieval process.
   * @param {GetDeductionsByEmployeeRequest} request - The request containing the employee ID.
   * @returns {Promise<Deduction[]>} A promise that resolves to an array of Deduction objects.
   * @throws {Error} If the employee ID is invalid or employee not found.
   */
  async execute(request: GetDeductionsByEmployeeRequest): Promise<Deduction[]> {
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    return this.deductionRepository.findByEmployeeId(request.employeeId);
  }
}

