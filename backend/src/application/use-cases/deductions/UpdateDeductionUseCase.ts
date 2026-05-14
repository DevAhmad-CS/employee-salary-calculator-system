/**
 * Update Deduction Use Case.
 * Handles the business logic for updating an existing deduction's information.
 * @class UpdateDeductionUseCase
 */
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';
import { Deduction } from '../../../domain/entities/Deduction';

/**
 * Interface for the Update Deduction Use Case request data.
 * @interface UpdateDeductionRequest
 */
export interface UpdateDeductionRequest {
  id: number;
  type?: string;
  amount?: number;
}

export class UpdateDeductionUseCase {
  /**
   * Creates an instance of UpdateDeductionUseCase.
   * @param {IDeductionRepository} deductionRepository - The deduction repository to interact with deduction data.
   */
  constructor(private deductionRepository: IDeductionRepository) {}

  /**
   * Executes the deduction update process.
   * @param {UpdateDeductionRequest} request - The request containing the deduction ID and data to update.
   * @returns {Promise<Deduction | null>} A promise that resolves to the updated Deduction object if found, otherwise null.
   * @throws {Error} If validation fails, deduction not found, or update encounters an error.
   */
  async execute(request: UpdateDeductionRequest): Promise<Deduction | null> {
    if (!request.id || request.id <= 0) {
      throw new Error('Invalid deduction ID.');
    }

    const existingDeduction = await this.deductionRepository.findById(request.id);
    if (!existingDeduction) {
      throw new Error('Deduction not found.');
    }

    // Prepare data for update
    const updateData: Partial<Omit<Deduction, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>> = {};
    
    if (request.type !== undefined) {
      if (request.type.trim() === '') {
        throw new Error('Deduction type cannot be empty.');
      }
      updateData.type = request.type.trim();
    }
    
    if (request.amount !== undefined) {
      if (request.amount < 0) {
        throw new Error('Deduction amount cannot be negative.');
      }
      updateData.amount = request.amount;
    }

    if (Object.keys(updateData).length === 0) {
      return existingDeduction; // No fields to update
    }

    return this.deductionRepository.update(request.id, updateData);
  }
}

