/**
 * Delete Employee Use Case
 * 
 * Handles the business logic for deleting an employee.
 * Validates that the employee exists before deletion.
 * 
 * @module application/use-cases/employees/DeleteEmployeeUseCase
 */

import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';

export class DeleteEmployeeUseCase {
  /**
   * Creates an instance of DeleteEmployeeUseCase
   * @param {IEmployeeRepository} employeeRepository - The employee repository to interact with employee data
   */
  constructor(private employeeRepository: IEmployeeRepository) {}

  /**
   * Executes the employee deletion process
   * @param {number} id - The ID of the employee to delete
   * @returns {Promise<boolean>} A promise that resolves to true if employee was deleted, false if not found
   * @throws {Error} If deletion fails
   */
  async execute(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Invalid employee ID');
    }

    // Check if employee exists
    const existingEmployee = await this.employeeRepository.findById(id);
    if (!existingEmployee) {
      throw new Error('Employee not found');
    }

    // Delete employee
    const deleted = await this.employeeRepository.delete(id);
    return deleted;
  }
}

