/**
 * Interface for Deduction Repository operations.
 * Defines the contract for interacting with deduction data persistence.
 * @interface IDeductionRepository
 */
import { Deduction } from '../entities/Deduction';

export interface IDeductionRepository {
  /**
   * Finds all deductions for a specific employee.
   * @param {number} employeeId - The ID of the employee.
   * @returns {Promise<Deduction[]>} A promise that resolves to an array of Deduction objects.
   */
  findByEmployeeId(employeeId: number): Promise<Deduction[]>;

  /**
   * Finds a deduction by its ID.
   * @param {number} id - The ID of the deduction to search for.
   * @returns {Promise<Deduction | null>} A promise that resolves to the Deduction object if found, otherwise null.
   */
  findById(id: number): Promise<Deduction | null>;

  /**
   * Creates a new deduction.
   * @param {Omit<Deduction, 'id' | 'createdAt' | 'updatedAt'>} deductionData - The deduction data to create, excluding auto-generated fields.
   * @returns {Promise<Deduction>} A promise that resolves to the created Deduction object.
   */
  create(deductionData: Omit<Deduction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deduction>;

  /**
   * Updates an existing deduction.
   * @param {number} id - The ID of the deduction to update.
   * @param {Partial<Omit<Deduction, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>} deductionData - The partial deduction data to update.
   * @returns {Promise<Deduction | null>} A promise that resolves to the updated Deduction object if found, otherwise null.
   */
  update(id: number, deductionData: Partial<Omit<Deduction, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>): Promise<Deduction | null>;

  /**
   * Deletes a deduction by its ID.
   * @param {number} id - The ID of the deduction to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the deduction was deleted, otherwise false.
   */
  delete(id: number): Promise<boolean>;
}

