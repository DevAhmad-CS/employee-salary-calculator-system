/**
 * Interface for Employee Repository operations.
 * Defines the contract for interacting with employee data persistence.
 * @interface IEmployeeRepository
 */
import { Employee } from '../entities/Employee';

/**
 * Options for filtering and paginating employee queries
 */
export interface EmployeeQueryOptions {
  search?: string; // Search by name, email, or department
  department?: string; // Filter by department
  status?: 'Active' | 'Inactive' | 'Terminated'; // Filter by status
  page?: number; // Page number (1-based)
  limit?: number; // Number of items per page
}

/**
 * Result of a paginated employee query
 */
export interface PaginatedEmployeesResult {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IEmployeeRepository {
  /**
   * Finds an employee by their ID.
   * @param {number} id - The ID of the employee to search for.
   * @returns {Promise<Employee | null>} A promise that resolves to the Employee object if found, otherwise null.
   */
  findById(id: number): Promise<Employee | null>;

  /**
   * Finds all employees with optional filtering and pagination.
   * @param {EmployeeQueryOptions} options - Query options for filtering and pagination.
   * @returns {Promise<PaginatedEmployeesResult>} A promise that resolves to paginated employee results.
   */
  findAll(options?: EmployeeQueryOptions): Promise<PaginatedEmployeesResult>;

  /**
   * Creates a new employee.
   * @param {Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>} employee - The employee data to create, excluding auto-generated fields.
   * @returns {Promise<Employee>} A promise that resolves to the created Employee object.
   */
  create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee>;

  /**
   * Updates an existing employee.
   * @param {number} id - The ID of the employee to update.
   * @param {Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>} employee - The employee data to update.
   * @returns {Promise<Employee>} A promise that resolves to the updated Employee object.
   */
  update(id: number, employee: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee>;

  /**
   * Deletes an employee by their ID.
   * @param {number} id - The ID of the employee to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the employee was deleted, false if not found.
   */
  delete(id: number): Promise<boolean>;
}

