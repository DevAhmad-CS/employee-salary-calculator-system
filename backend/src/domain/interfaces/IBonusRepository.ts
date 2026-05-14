/**
 * Interface for Bonus Repository operations.
 * Defines the contract for interacting with bonus data persistence.
 * @interface IBonusRepository
 */
import { Bonus } from '../entities/Bonus';

export interface IBonusRepository {
  /**
   * Finds all bonuses for a specific employee.
   * @param {number} employeeId - The ID of the employee.
   * @returns {Promise<Bonus[]>} A promise that resolves to an array of Bonus objects.
   */
  findByEmployeeId(employeeId: number): Promise<Bonus[]>;

  /**
   * Finds a bonus by its ID.
   * @param {number} id - The ID of the bonus to search for.
   * @returns {Promise<Bonus | null>} A promise that resolves to the Bonus object if found, otherwise null.
   */
  findById(id: number): Promise<Bonus | null>;

  /**
   * Creates a new bonus.
   * @param {Omit<Bonus, 'id' | 'createdAt' | 'updatedAt'>} bonusData - The bonus data to create, excluding auto-generated fields.
   * @returns {Promise<Bonus>} A promise that resolves to the created Bonus object.
   */
  create(bonusData: Omit<Bonus, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bonus>;

  /**
   * Updates an existing bonus.
   * @param {number} id - The ID of the bonus to update.
   * @param {Partial<Omit<Bonus, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>} bonusData - The partial bonus data to update.
   * @returns {Promise<Bonus | null>} A promise that resolves to the updated Bonus object if found, otherwise null.
   */
  update(id: number, bonusData: Partial<Omit<Bonus, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>): Promise<Bonus | null>;

  /**
   * Deletes a bonus by its ID.
   * @param {number} id - The ID of the bonus to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the bonus was deleted, otherwise false.
   */
  delete(id: number): Promise<boolean>;
}

