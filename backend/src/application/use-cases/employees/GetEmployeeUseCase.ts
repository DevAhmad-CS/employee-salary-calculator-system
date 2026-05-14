/**
 * Get Employee Use Case
 * 
 * Handles the business logic for retrieving a single employee by ID.
 * 
 * @module application/use-cases/employees/GetEmployeeUseCase
 */

import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Employee } from '../../../domain/entities/Employee';

export class GetEmployeeUseCase {
  /**
   * Creates an instance of GetEmployeeUseCase
   * @param {IEmployeeRepository} employeeRepository - The employee repository to interact with employee data
   */
  constructor(private employeeRepository: IEmployeeRepository) {}

  /**
   * Executes the employee retrieval process
   * @param {number} id - The ID of the employee to retrieve
   * @returns {Promise<Employee | null>} A promise that resolves to the employee if found, otherwise null
   * @throws {Error} If retrieval fails
   */
  async execute(id: number): Promise<Employee | null> {
    if (!id || id <= 0) {
      throw new Error('Invalid employee ID');
    }

    const employee = await this.employeeRepository.findById(id);
    return employee;
  }
}

