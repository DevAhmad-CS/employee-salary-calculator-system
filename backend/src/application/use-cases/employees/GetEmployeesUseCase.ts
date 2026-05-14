/**
 * Get Employees Use Case
 * 
 * Handles the business logic for retrieving multiple employees with filtering and pagination.
 * 
 * @module application/use-cases/employees/GetEmployeesUseCase
 */

import { IEmployeeRepository, EmployeeQueryOptions, PaginatedEmployeesResult } from '../../../domain/interfaces/IEmployeeRepository';

export class GetEmployeesUseCase {
  /**
   * Creates an instance of GetEmployeesUseCase
   * @param {IEmployeeRepository} employeeRepository - The employee repository to interact with employee data
   */
  constructor(private employeeRepository: IEmployeeRepository) {}

  /**
   * Executes the employees retrieval process
   * @param {EmployeeQueryOptions} options - Query options for filtering and pagination
   * @returns {Promise<PaginatedEmployeesResult>} A promise that resolves to paginated employee results
   * @throws {Error} If retrieval fails
   */
  async execute(options: EmployeeQueryOptions = {}): Promise<PaginatedEmployeesResult> {
    // Validate pagination parameters
    const page = options.page || 1;
    const limit = options.limit || 10;

    if (page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const result = await this.employeeRepository.findAll({
      search: options.search,
      department: options.department,
      status: options.status,
      page,
      limit,
    });

    return result;
  }
}

