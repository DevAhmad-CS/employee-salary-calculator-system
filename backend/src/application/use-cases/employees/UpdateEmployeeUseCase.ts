/**
 * Update Employee Use Case
 * 
 * Handles the business logic for updating an existing employee.
 * Validates update data and updates the employee in the database.
 * 
 * @module application/use-cases/employees/UpdateEmployeeUseCase
 */

import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { Employee } from '../../../domain/entities/Employee';

/**
 * Interface for the Update Employee Use Case request data
 */
export interface UpdateEmployeeRequest {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  department?: string;
  position?: string;
  hireDate?: Date;
  basicSalary?: number;
  status?: 'Active' | 'Inactive' | 'Terminated';
}

export class UpdateEmployeeUseCase {
  /**
   * Creates an instance of UpdateEmployeeUseCase
   * @param {IEmployeeRepository} employeeRepository - The employee repository to interact with employee data
   */
  constructor(private employeeRepository: IEmployeeRepository) {}

  /**
   * Executes the employee update process
   * @param {number} id - The ID of the employee to update
   * @param {UpdateEmployeeRequest} request - The employee update request
   * @returns {Promise<Employee>} A promise that resolves to the updated employee
   * @throws {Error} If validation fails, employee not found, or update fails
   */
  async execute(id: number, request: UpdateEmployeeRequest): Promise<Employee> {
    if (!id || id <= 0) {
      throw new Error('Invalid employee ID');
    }

    // Check if employee exists
    const existingEmployee = await this.employeeRepository.findById(id);
    if (!existingEmployee) {
      throw new Error('Employee not found');
    }

    // Validation for provided fields
    if (request.fullName !== undefined && request.fullName.trim().length === 0) {
      throw new Error('Full name cannot be empty');
    }

    if (request.department !== undefined && request.department.trim().length === 0) {
      throw new Error('Department cannot be empty');
    }

    if (request.position !== undefined && request.position.trim().length === 0) {
      throw new Error('Position cannot be empty');
    }

    if (request.basicSalary !== undefined && request.basicSalary < 0) {
      throw new Error('Basic salary must be a positive number');
    }

    // Email validation (if provided)
    if (request.email !== undefined && request.email && request.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        throw new Error('Invalid email format');
      }
    }

    // Build update data object
    const updateData: any = {};

    if (request.fullName !== undefined) {
      updateData.fullName = request.fullName.trim();
    }

    if (request.email !== undefined) {
      updateData.email = request.email?.trim() || null;
    }

    if (request.phone !== undefined) {
      updateData.phone = request.phone?.trim() || null;
    }

    if (request.department !== undefined) {
      updateData.department = request.department.trim();
    }

    if (request.position !== undefined) {
      updateData.position = request.position.trim();
    }

    if (request.hireDate !== undefined) {
      updateData.hireDate = request.hireDate;
    }

    if (request.basicSalary !== undefined) {
      updateData.basicSalary = request.basicSalary;
    }

    if (request.status !== undefined) {
      updateData.status = request.status;
    }

    // Update employee
    const updatedEmployee = await this.employeeRepository.update(id, updateData);
    return updatedEmployee;
  }
}

