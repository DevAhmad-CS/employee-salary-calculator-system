/**
 * Employee Repository Implementation
 * 
 * This class implements the IEmployeeRepository interface using PostgreSQL database.
 * It handles all database operations related to employee management, including
 * CRUD operations, search, filtering, and pagination.
 * 
 * @module infrastructure/database/repositories/EmployeeRepository
 * @implements {IEmployeeRepository}
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * It depends on the domain interfaces but not on domain entities directly.
 * 
 * @example
 * ```typescript
 * const employeeRepository = new EmployeeRepository();
 * const employees = await employeeRepository.findAll({ page: 1, limit: 10 });
 * ```
 */

import { Pool } from 'pg';
import { IEmployeeRepository, EmployeeQueryOptions, PaginatedEmployeesResult } from '../../../domain/interfaces/IEmployeeRepository';
import { Employee } from '../../../domain/entities/Employee';
import { pool } from '../postgres/connection';

/**
 * PostgreSQL implementation of the Employee Repository
 * 
 * Provides concrete implementation of employee data access operations
 * using PostgreSQL connection pool for efficient database interactions.
 */
export class EmployeeRepository implements IEmployeeRepository {
  /**
   * PostgreSQL connection pool instance
   * 
   * @private
   * @type {Pool}
   */
  private pool: Pool;

  /**
   * Creates a new instance of EmployeeRepository
   * 
   * Initializes the repository with the shared database connection pool.
   * The pool is imported from the connection module to ensure singleton pattern.
   */
  constructor() {
    this.pool = pool;
  }

  /**
   * Finds an employee by their ID
   * 
   * @param {number} id - The ID of the employee to search for
   * @returns {Promise<Employee | null>} Employee object if found, otherwise null
   * @throws {Error} If database query execution fails
   */
  async findById(id: number): Promise<Employee | null> {
    const query = 'SELECT * FROM employees WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (!result.rows[0]) {
      return null;
    }
    
    // Convert database snake_case to TypeScript camelCase
    const dbRow = result.rows[0];
    return {
      id: dbRow.id,
      fullName: dbRow.full_name,
      email: dbRow.email || null,
      phone: dbRow.phone || null,
      department: dbRow.department,
      position: dbRow.position,
      hireDate: dbRow.hire_date,
      basicSalary: parseFloat(dbRow.basic_salary),
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  /**
   * Finds all employees with optional filtering and pagination
   * 
   * @param {EmployeeQueryOptions} options - Query options for filtering and pagination
   * @returns {Promise<PaginatedEmployeesResult>} Paginated employee results
   * @throws {Error} If database query execution fails
   */
  async findAll(options: EmployeeQueryOptions = {}): Promise<PaginatedEmployeesResult> {
    const {
      search,
      department,
      status,
      page = 1,
      limit = 10,
    } = options;

    // Build WHERE clause conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        full_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        department ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      conditions.push(`department = $${paramIndex}`);
      values.push(department);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM employees ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM employees 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);
    
    const result = await this.pool.query(query, values);

    // Convert database snake_case to TypeScript camelCase
    const employees: Employee[] = result.rows.map((dbRow) => ({
      id: dbRow.id,
      fullName: dbRow.full_name,
      email: dbRow.email || null,
      phone: dbRow.phone || null,
      department: dbRow.department,
      position: dbRow.position,
      hireDate: dbRow.hire_date,
      basicSalary: parseFloat(dbRow.basic_salary),
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    }));

    return {
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Creates a new employee
   * 
   * @param {Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>} employeeData - Employee data to insert
   * @returns {Promise<Employee>} The newly created employee
   * @throws {Error} If database insertion fails
   */
  async create(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const query = `
      INSERT INTO employees (full_name, email, phone, department, position, hire_date, basic_salary, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      employeeData.fullName,
      employeeData.email || null,
      employeeData.phone || null,
      employeeData.department,
      employeeData.position,
      employeeData.hireDate,
      employeeData.basicSalary,
      employeeData.status || 'Active',
    ];
    
    const result = await this.pool.query(query, values);
    const dbRow = result.rows[0];

    // Convert database snake_case to TypeScript camelCase
    return {
      id: dbRow.id,
      fullName: dbRow.full_name,
      email: dbRow.email || null,
      phone: dbRow.phone || null,
      department: dbRow.department,
      position: dbRow.position,
      hireDate: dbRow.hire_date,
      basicSalary: parseFloat(dbRow.basic_salary),
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  /**
   * Updates an existing employee
   * 
   * @param {number} id - The ID of the employee to update
   * @param {Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>} employeeData - Employee data to update
   * @returns {Promise<Employee>} The updated employee
   * @throws {Error} If employee not found or database update fails
   */
  async update(id: number, employeeData: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Employee> {
    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (employeeData.fullName !== undefined) {
      fields.push(`full_name = $${paramIndex}`);
      values.push(employeeData.fullName);
      paramIndex++;
    }

    if (employeeData.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(employeeData.email || null);
      paramIndex++;
    }

    if (employeeData.phone !== undefined) {
      fields.push(`phone = $${paramIndex}`);
      values.push(employeeData.phone || null);
      paramIndex++;
    }

    if (employeeData.department !== undefined) {
      fields.push(`department = $${paramIndex}`);
      values.push(employeeData.department);
      paramIndex++;
    }

    if (employeeData.position !== undefined) {
      fields.push(`position = $${paramIndex}`);
      values.push(employeeData.position);
      paramIndex++;
    }

    if (employeeData.hireDate !== undefined) {
      fields.push(`hire_date = $${paramIndex}`);
      values.push(employeeData.hireDate);
      paramIndex++;
    }

    if (employeeData.basicSalary !== undefined) {
      fields.push(`basic_salary = $${paramIndex}`);
      values.push(employeeData.basicSalary);
      paramIndex++;
    }

    if (employeeData.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(employeeData.status);
      paramIndex++;
    }

    if (fields.length === 0) {
      // No fields to update, return existing employee
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Employee not found');
      }
      return existing;
    }

    // Add updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add WHERE clause
    values.push(id);
    const query = `
      UPDATE employees 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const dbRow = result.rows[0];

    // Convert database snake_case to TypeScript camelCase
    return {
      id: dbRow.id,
      fullName: dbRow.full_name,
      email: dbRow.email || null,
      phone: dbRow.phone || null,
      department: dbRow.department,
      position: dbRow.position,
      hireDate: dbRow.hire_date,
      basicSalary: parseFloat(dbRow.basic_salary),
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  /**
   * Deletes an employee by their ID
   * 
   * @param {number} id - The ID of the employee to delete
   * @returns {Promise<boolean>} True if employee was deleted, false if not found
   * @throws {Error} If database deletion fails
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM employees WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    
    return result.rows.length > 0;
  }
}

