/**
 * Interface for Allowance Repository operations.
 * Defines the contract for interacting with allowance data persistence.
 * @interface IAllowanceRepository
 */
import { Allowance } from '../entities/Allowance';

export interface IAllowanceRepository {
  /**
   * Finds all allowances for a specific employee.
   * @param {number} employeeId - The ID of the employee.
   * @returns {Promise<Allowance[]>} A promise that resolves to an array of Allowance objects.
   */
  findByEmployeeId(employeeId: number): Promise<Allowance[]>;

  /**
   * Finds an allowance by its ID.
   * @param {number} id - The ID of the allowance to search for.
   * @returns {Promise<Allowance | null>} A promise that resolves to the Allowance object if found, otherwise null.
   */
  findById(id: number): Promise<Allowance | null>;

  /**
   * Creates a new allowance.
   * @param {Omit<Allowance, 'id' | 'createdAt' | 'updatedAt'>} allowanceData - The allowance data to create, excluding auto-generated fields.
   * @returns {Promise<Allowance>} A promise that resolves to the created Allowance object.
   */
  create(allowanceData: Omit<Allowance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Allowance>;

  /**
   * Updates an existing allowance.
   * @param {number} id - The ID of the allowance to update.
   * @param {Partial<Omit<Allowance, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>} allowanceData - The partial allowance data to update.
   * @returns {Promise<Allowance | null>} A promise that resolves to the updated Allowance object if found, otherwise null.
   */
  update(id: number, allowanceData: Partial<Omit<Allowance, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>): Promise<Allowance | null>;

  /**
   * Deletes an allowance by its ID.
   * @param {number} id - The ID of the allowance to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the allowance was deleted, otherwise false.
   */
  delete(id: number): Promise<boolean>;
}

