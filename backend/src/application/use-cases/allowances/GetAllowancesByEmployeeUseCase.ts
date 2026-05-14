/**
 * Get Allowances by Employee Use Case.
 * Handles the business logic for retrieving all allowances for a specific employee.
 * @class GetAllowancesByEmployeeUseCase
 */
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Allowance } from '../../../domain/entities/Allowance';

/**
 * Interface for the Get Allowances by Employee Use Case request data.
 * @interface GetAllowancesByEmployeeRequest
 */
export interface GetAllowancesByEmployeeRequest {
  employeeId: number;
}

export class GetAllowancesByEmployeeUseCase {
  /**
   * Creates an instance of GetAllowancesByEmployeeUseCase.
   * @param {IAllowanceRepository} allowanceRepository - The allowance repository to interact with allowance data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to verify employee existence.
   */
  constructor(
    private allowanceRepository: IAllowanceRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the allowances retrieval process.
   * @param {GetAllowancesByEmployeeRequest} request - The request containing the employee ID.
   * @returns {Promise<Allowance[]>} A promise that resolves to an array of Allowance objects.
   * @throws {Error} If the employee ID is invalid or employee not found.
   */
  async execute(request: GetAllowancesByEmployeeRequest): Promise<Allowance[]> {
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    return this.allowanceRepository.findByEmployeeId(request.employeeId);
  }
}

