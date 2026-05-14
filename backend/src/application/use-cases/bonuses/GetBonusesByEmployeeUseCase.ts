/**
 * Get Bonuses by Employee Use Case.
 * Handles the business logic for retrieving all bonuses for a specific employee.
 * @class GetBonusesByEmployeeUseCase
 */
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Bonus } from '../../../domain/entities/Bonus';

/**
 * Interface for the Get Bonuses by Employee Use Case request data.
 * @interface GetBonusesByEmployeeRequest
 */
export interface GetBonusesByEmployeeRequest {
  employeeId: number;
}

export class GetBonusesByEmployeeUseCase {
  /**
   * Creates an instance of GetBonusesByEmployeeUseCase.
   * @param {IBonusRepository} bonusRepository - The bonus repository to interact with bonus data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to verify employee existence.
   */
  constructor(
    private bonusRepository: IBonusRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the bonuses retrieval process.
   * @param {GetBonusesByEmployeeRequest} request - The request containing the employee ID.
   * @returns {Promise<Bonus[]>} A promise that resolves to an array of Bonus objects.
   * @throws {Error} If the employee ID is invalid or employee not found.
   */
  async execute(request: GetBonusesByEmployeeRequest): Promise<Bonus[]> {
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    return this.bonusRepository.findByEmployeeId(request.employeeId);
  }
}

