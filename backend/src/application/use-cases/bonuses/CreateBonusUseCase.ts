/**
 * Create Bonus Use Case.
 * Handles the business logic for creating a new bonus for an employee.
 * @class CreateBonusUseCase
 */
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Bonus } from '../../../domain/entities/Bonus';

/**
 * Interface for the Create Bonus Use Case request data.
 * @interface CreateBonusRequest
 */
export interface CreateBonusRequest {
  employeeId: number;
  type: string;
  amount: number;
  awardedDate?: Date | string; // Optional, defaults to current date
}

export class CreateBonusUseCase {
  /**
   * Creates an instance of CreateBonusUseCase.
   * @param {IBonusRepository} bonusRepository - The bonus repository to interact with bonus data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to verify employee existence.
   */
  constructor(
    private bonusRepository: IBonusRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  /**
   * Executes the bonus creation process.
   * @param {CreateBonusRequest} request - The request containing new bonus data.
   * @returns {Promise<Bonus>} A promise that resolves to the created Bonus object.
   * @throws {Error} If validation fails or employee not found.
   */
  async execute(request: CreateBonusRequest): Promise<Bonus> {
    // Validate input
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }
    if (!request.type || request.type.trim() === '') {
      throw new Error('Bonus type is required.');
    }
    if (request.amount === undefined || request.amount < 0) {
      throw new Error('Bonus amount must be a positive number.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Create bonus
    const awardedDate = request.awardedDate 
      ? (typeof request.awardedDate === 'string' ? new Date(request.awardedDate) : request.awardedDate)
      : new Date(); // Default to current date if not provided

    const newBonus: Omit<Bonus, 'id' | 'createdAt' | 'updatedAt'> = {
      employeeId: request.employeeId,
      type: request.type.trim(),
      amount: request.amount,
      awardedDate: awardedDate,
    };

    return this.bonusRepository.create(newBonus);
  }
}

