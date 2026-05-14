/**
 * Employee Service
 * 
 * This module provides employee-related API methods.
 * It uses the API client to communicate with the backend employee endpoints.
 * 
 * @module services/api/employee.service
 * 
 * @remarks
 * This service handles:
 * - Fetching employees (with pagination, search, filtering)
 * - Creating new employees
 * - Updating existing employees
 * - Deleting employees
 * - Type-safe request/response interfaces
 * 
 * @example
 * ```typescript
 * import { employeeService } from './services/api/employee.service';
 * 
 * // Get all employees
 * const response = await employeeService.getAll({ page: 1, limit: 10 });
 * 
 * // Create new employee
 * const newEmployee = await employeeService.create({
 *   fullName: 'John Doe',
 *   department: 'Engineering',
 *   position: 'Software Engineer',
 *   hireDate: new Date(),
 *   basicSalary: 5000
 * });
 * ```
 */

import apiClient from './client';

/**
 * Employee entity interface
 * 
 * Represents an employee in the system.
 * 
 * @interface Employee
 */
export interface Employee {
  id: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  department: string;
  position: string;
  hireDate: Date;
  basicSalary: number;
  status: 'Active' | 'Inactive' | 'Terminated';
  userAccount?: {
    id: number;
    username: string;
    role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for fetching employees
 * 
 * @interface GetEmployeesParams
 */
export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string; // Search by fullName, email, phone, department, position
  department?: string;
  status?: 'Active' | 'Inactive' | 'Terminated';
}

/**
 * Paginated employees response
 * 
 * @interface PaginatedEmployeesResponse
 */
export interface PaginatedEmployeesResponse {
  success: boolean;
  data: {
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Single employee response
 * 
 * @interface EmployeeResponse
 */
export interface EmployeeResponse {
  success: boolean;
  data: Employee;
}

export interface CreateEmployeeAccountRequest {
  username: string;
  password: string;
  role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  email?: string | null;
}

export interface CreateEmployeeAccountResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      username: string;
      role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
      employeeId?: number | null;
      createdAt?: Date;
      updatedAt?: Date;
    };
    emailSent: boolean;
  };
  message?: string;
}

export interface UpdateEmployeeAccountRequest {
  username?: string;
  password?: string;
  role?: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
  email?: string | null;
}

export interface UpdateEmployeeAccountResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      username: string;
      role: 'Admin' | 'HR' | 'Accountant' | 'Employee' | 'Management';
      employeeId?: number | null;
      createdAt?: Date;
      updatedAt?: Date;
    };
    emailSent: boolean;
  };
  message?: string;
}

/**
 * Create employee request payload
 * 
 * @interface CreateEmployeeRequest
 */
export interface CreateEmployeeRequest {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  department: string;
  position: string;
  hireDate: Date | string;
  basicSalary: number;
  status?: 'Active' | 'Inactive' | 'Terminated';
}

/**
 * Update employee request payload
 * 
 * All fields are optional except id (which is in the URL).
 * 
 * @interface UpdateEmployeeRequest
 */
export interface UpdateEmployeeRequest {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  department?: string;
  position?: string;
  hireDate?: Date | string;
  basicSalary?: number;
  status?: 'Active' | 'Inactive' | 'Terminated';
}

/**
 * Delete employee response
 * 
 * @interface DeleteEmployeeResponse
 */
export interface DeleteEmployeeResponse {
  success: boolean;
  message: string;
}

/**
 * Employee Service Object
 * 
 * Provides methods for employee operations.
 * All methods return promises that resolve with typed response data.
 * 
 * @namespace employeeService
 */
export const employeeService = {
  /**
   * Get all employees
   * 
   * Fetches a paginated list of employees with optional search and filtering.
   * 
   * @param {GetEmployeesParams} params - Query parameters for pagination, search, and filtering
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.search - Search term (searches in fullName, email, phone, department, position)
   * @param {string} params.department - Filter by department
   * @param {string} params.status - Filter by status (Active, Inactive, Terminated)
   * @returns {Promise<PaginatedEmployeesResponse>} Promise that resolves with paginated employees
   * @throws {AxiosError} If request fails or network error occurs
   * 
   * @example
   * ```typescript
   * // Get first page with 10 employees
   * const response = await employeeService.getAll({ page: 1, limit: 10 });
   * 
   * // Search employees
   * const searchResults = await employeeService.getAll({ 
   *   search: 'john',
   *   page: 1,
   *   limit: 20
   * });
   * 
   * // Filter by department
   * const engineeringEmployees = await employeeService.getAll({
   *   department: 'Engineering',
   *   status: 'Active'
   * });
   * ```
   */
  getAll: async (params?: GetEmployeesParams): Promise<PaginatedEmployeesResponse> => {
    const response = await apiClient.get<PaginatedEmployeesResponse>('/employees', {
      params,
    });
    return response.data;
  },

  /**
   * Get employee by ID
   * 
   * Fetches a single employee by their ID.
   * 
   * @param {number} id - Employee ID
   * @returns {Promise<EmployeeResponse>} Promise that resolves with employee data
   * @throws {AxiosError} If employee not found or network error occurs
   * 
   * @example
   * ```typescript
   * const employee = await employeeService.getById(1);
   * console.log(employee.data.fullName);
   * ```
   */
  getById: async (id: number): Promise<EmployeeResponse> => {
    const response = await apiClient.get<EmployeeResponse>(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create new employee
   * 
   * Creates a new employee in the system.
   * 
   * @param {CreateEmployeeRequest} employeeData - Employee data to create
   * @param {string} employeeData.fullName - Employee's full name (required)
   * @param {string} employeeData.department - Employee's department (required)
   * @param {string} employeeData.position - Employee's position (required)
   * @param {Date|string} employeeData.hireDate - Employee's hire date (required)
   * @param {number} employeeData.basicSalary - Employee's basic salary (required)
   * @param {string} employeeData.email - Employee's email (optional)
   * @param {string} employeeData.phone - Employee's phone (optional)
   * @param {string} employeeData.status - Employee's status (optional, default: Active)
   * @returns {Promise<EmployeeResponse>} Promise that resolves with created employee data
   * @throws {AxiosError} If validation fails or network error occurs
   * 
   * @example
   * ```typescript
   * const newEmployee = await employeeService.create({
   *   fullName: 'John Doe',
   *   email: 'john.doe@example.com',
   *   phone: '+1234567890',
   *   department: 'Engineering',
   *   position: 'Software Engineer',
   *   hireDate: new Date('2024-01-15'),
   *   basicSalary: 5000,
   *   status: 'Active'
   * });
   * ```
   */
  create: async (employeeData: CreateEmployeeRequest): Promise<EmployeeResponse> => {
    const response = await apiClient.post<EmployeeResponse>('/employees', employeeData);
    return response.data;
  },

  /**
   * Update employee
   * 
   * Updates an existing employee's information.
   * Only provided fields will be updated.
   * 
   * @param {number} id - Employee ID
   * @param {UpdateEmployeeRequest} employeeData - Employee data to update (all fields optional)
   * @returns {Promise<EmployeeResponse>} Promise that resolves with updated employee data
   * @throws {AxiosError} If employee not found, validation fails, or network error occurs
   * 
   * @example
   * ```typescript
   * // Update only salary
   * const updated = await employeeService.update(1, {
   *   basicSalary: 6000
   * });
   * 
   * // Update multiple fields
   * const updated = await employeeService.update(1, {
   *   fullName: 'Jane Doe',
   *   department: 'Marketing',
   *   position: 'Marketing Manager'
   * });
   * ```
   */
  update: async (id: number, employeeData: UpdateEmployeeRequest): Promise<EmployeeResponse> => {
    const response = await apiClient.put<EmployeeResponse>(`/employees/${id}`, employeeData);
    return response.data;
  },

  /**
   * Delete employee
   * 
   * Deletes an employee from the system.
   * 
   * @param {number} id - Employee ID
   * @returns {Promise<DeleteEmployeeResponse>} Promise that resolves with deletion confirmation
   * @throws {AxiosError} If employee not found or network error occurs
   * 
   * @example
   * ```typescript
   * await employeeService.delete(1);
   * console.log('Employee deleted successfully');
   * ```
   */
  delete: async (id: number): Promise<DeleteEmployeeResponse> => {
    const response = await apiClient.delete<DeleteEmployeeResponse>(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create login account for employee
   * 
   * @param {number} employeeId - Employee ID
   * @param {CreateEmployeeAccountRequest} accountData - Account credentials
   * @returns {Promise<CreateEmployeeAccountResponse>} Account creation response
   */
  createAccount: async (
    employeeId: number,
    accountData: CreateEmployeeAccountRequest
  ): Promise<CreateEmployeeAccountResponse> => {
    const response = await apiClient.post<CreateEmployeeAccountResponse>(
      `/employees/${employeeId}/account`,
      accountData
    );
    return response.data;
  },

  /**
   * Update login account for employee
   *
   * @param {number} employeeId - Employee ID
   * @param {UpdateEmployeeAccountRequest} accountData - Account updates
   * @returns {Promise<UpdateEmployeeAccountResponse>} Account update response
   */
  updateAccount: async (
    employeeId: number,
    accountData: UpdateEmployeeAccountRequest
  ): Promise<UpdateEmployeeAccountResponse> => {
    const response = await apiClient.put<UpdateEmployeeAccountResponse>(
      `/employees/${employeeId}/account`,
      accountData
    );
    return response.data;
  },
};

