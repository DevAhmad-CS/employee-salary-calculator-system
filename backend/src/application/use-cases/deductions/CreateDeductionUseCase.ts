/**
 * Create Deduction Use Case.
 * Handles the business logic for creating a new deduction for an employee.
 * @class CreateDeductionUseCase
 */
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Deduction } from '../../../domain/entities/Deduction';

/**
 * Interface for the Create Deduction Use Case request data.
 * @interface CreateDeductionRequest
 */
export interface CreateDeductionRequest {
  employeeId: number;
  type: string;
  amount: number;
}

export class CreateDeductionUseCase {
  /**
   * Creates an instance of CreateDeductionUseCase.
   * @param {IDeductionRepository} deductionRepository - The deduction repository to interact with deduction data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to verify employee existence.
   */
  constructor(
    private deductionRepository: IDeductionRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the deduction creation process.
   * @param {CreateDeductionRequest} request - The request containing new deduction data.
   * @returns {Promise<Deduction>} A promise that resolves to the created Deduction object.
   * @throws {Error} If validation fails or employee not found.
   */
  async execute(request: CreateDeductionRequest): Promise<Deduction> {
    // Validate input
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }
    if (!request.type || request.type.trim() === '') {
      throw new Error('Deduction type is required.');
    }
    if (request.amount === undefined || request.amount < 0) {
      throw new Error('Deduction amount must be a positive number.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Create deduction
    const newDeduction: Omit<Deduction, 'id' | 'createdAt' | 'updatedAt'> = {
      employeeId: request.employeeId,
      type: request.type.trim(),
      amount: request.amount,
    };

    return this.deductionRepository.create(newDeduction);
  }
}

