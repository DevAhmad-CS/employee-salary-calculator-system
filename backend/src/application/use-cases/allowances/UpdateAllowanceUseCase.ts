/**
 * Update Allowance Use Case.
 * Handles the business logic for updating an existing allowance's information.
 * @class UpdateAllowanceUseCase
 */
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';
import { Allowance } from '../../../domain/entities/Allowance';

/**
 * Interface for the Update Allowance Use Case request data.
 * @interface UpdateAllowanceRequest
 */
export interface UpdateAllowanceRequest {
  id: number;
  type?: string;
  amount?: number;
}

export class UpdateAllowanceUseCase {
  /**
   * Creates an instance of UpdateAllowanceUseCase.
   * @param {IAllowanceRepository} allowanceRepository - The allowance repository to interact with allowance data.
   */
  constructor(private allowanceRepository: IAllowanceRepository) {}

  /**
   * Executes the allowance update process.
   * @param {UpdateAllowanceRequest} request - The request containing the allowance ID and data to update.
   * @returns {Promise<Allowance | null>} A promise that resolves to the updated Allowance object if found, otherwise null.
   * @throws {Error} If validation fails, allowance not found, or update encounters an error.
   */
  async execute(request: UpdateAllowanceRequest): Promise<Allowance | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid allowance ID.');
    }

    const existingAllowance = await this.allowanceRepository.findById(request.id);
    if (!existingAllowance) {
      throw new Error('Allowance not found.');
    }

    // Prepare data for update
    const updateData: Partial<Omit<Allowance, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>> = {};
    
    if (request.type !== undefined) {
      if (request.type.trim() === '') {
        throw new Error('Allowance type cannot be empty.');
      }
      updateData.type = request.type.trim();
    }
    
    if (request.amount !== undefined) {
      if (request.amount < 0) {
        throw new Error('Allowance amount cannot be negative.');
      }
      updateData.amount = request.amount;
    }

    if (Object.keys(updateData).length === 0) {
      return existingAllowance; // No fields to update
    }

    return this.allowanceRepository.update(request.id, updateData);
  }
}

