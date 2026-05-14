/**
 * Create Employee Use Case
 * 
 * Handles the business logic for creating a new employee.
 * Validates employee data and creates the employee in the database.
 * 
 * @module application/use-cases/employees/CreateEmployeeUseCase
 */

import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Employee } from '../../../domain/entities/Employee';

/**
 * Interface for the Create Employee Use Case request data
 */
export interface CreateEmployeeRequest {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  department: string;
  position: string;
  hireDate: Date;
  basicSalary: number;
  status?: 'Active' | 'Inactive' | 'Terminated';
}

export class CreateEmployeeUseCase {
  /**
   * Creates an instance of CreateEmployeeUseCase
   * @param {IEmployeeRepository} employeeRepository - The employee repository to interact with employee data
   */
  constructor(private employeeRepository: IEmployeeRepository) {}

  /**
   * Executes the employee creation process
   * @param {CreateEmployeeRequest} request - The employee creation request
   * @returns {Promise<Employee>} A promise that resolves to the created employee
   * @throws {Error} If validation fails or creation fails
   */
  async execute(request: CreateEmployeeRequest): Promise<Employee> {
    // Validation
    if (!request.fullName || request.fullName.trim().length === 0) {
      throw new Error('Full name is required');
    }

    if (!request.department || request.department.trim().length === 0) {
      throw new Error('Department is required');
    }

    if (!request.position || request.position.trim().length === 0) {
      throw new Error('Position is required');
    }

    if (!request.hireDate) {
      throw new Error('Hire date is required');
    }

    if (request.basicSalary === undefined || request.basicSalary === null || request.basicSalary < 0) {
      throw new Error('Basic salary must be a positive number');
    }

    // Email validation (if provided)
    if (request.email && request.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        throw new Error('Invalid email format');
      }
    }

    // Create employee
    const employee = await this.employeeRepository.create({
      fullName: request.fullName.trim(),
      email: request.email?.trim() || null,
      phone: request.phone?.trim() || null,
      department: request.department.trim(),
      position: request.position.trim(),
      hireDate: request.hireDate,
      basicSalary: request.basicSalary,
      status: request.status || 'Active',
    });

    return employee;
  }
}

