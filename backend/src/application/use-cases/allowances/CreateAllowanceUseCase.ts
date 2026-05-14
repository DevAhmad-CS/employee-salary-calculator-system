/**
 * Create Allowance Use Case.
 * Handles the business logic for creating a new allowance for an employee.
 * @class CreateAllowanceUseCase
 */
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Allowance } from '../../../domain/entities/Allowance';

/**
 * Interface for the Create Allowance Use Case request data.
 * @interface CreateAllowanceRequest
 */
export interface CreateAllowanceRequest {
  employeeId: number;
  type: string;
  amount: number;
}

export class CreateAllowanceUseCase {
  /**
   * Creates an instance of CreateAllowanceUseCase.
   * @param {IAllowanceRepository} allowanceRepository - The allowance repository to interact with allowance data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to verify employee existence.
   */
  constructor(
    private allowanceRepository: IAllowanceRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the allowance creation process.
   * @param {CreateAllowanceRequest} request - The request containing new allowance data.
   * @returns {Promise<Allowance>} A promise that resolves to the created Allowance object.
   * @throws {Error} If validation fails or employee not found.
   */
  async execute(request: CreateAllowanceRequest): Promise<Allowance> {
    // Validate input
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }
    if (!request.type || request.type.trim() === '') {
      throw new Error('Allowance type is required.');
    }
    if (request.amount === undefined || request.amount < 0) {
      throw new Error('Allowance amount must be a positive number.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Create allowance
    const newAllowance: Omit<Allowance, 'id' | 'createdAt' | 'updatedAt'> = {
      employeeId: request.employeeId,
      type: request.type.trim(),
      amount: request.amount,
    };

    return this.allowanceRepository.create(newAllowance);
  }
}

