/**
 * User Repository Implementation
 * 
 * This class implements the IUserRepository interface using PostgreSQL database.
 * It handles all database operations related to user management, including
 * CRUD operations and user authentication data retrieval.
 * 
 * @module infrastructure/database/repositories/UserRepository
 * @implements {IUserRepository}
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * It depends on the domain interfaces but not on domain entities directly.
 * 
 * @example
 * ```typescript
 * const userRepository = new UserRepository();
 * const user = await userRepository.findByUsername('john_doe');
 * ```
 */

import { Pool } from 'pg';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { User, UserWithoutPassword } from '../../../domain/entities/User';
import { pool } from '../postgres/connection';

/**
 * PostgreSQL implementation of the User Repository
 * 
 * Provides concrete implementation of user data access operations
 * using PostgreSQL connection pool for efficient database interactions.
 */
export class UserRepository implements IUserRepository {
  /**
   * PostgreSQL connection pool instance
   * 
   * @private
   * @type {Pool}
   */
  private pool: Pool;

  /**
   * Creates a new instance of UserRepository
   * 
   * Initializes the repository with the shared database connection pool.
   * The pool is imported from the connection module to ensure singleton pattern.
   */
  constructor() {
    this.pool = pool;
  }

  /**
   * Finds a user by username
   * 
   * Executes a SQL query to retrieve user data including password hash.
   * This method is primarily used for authentication purposes.
   * 
   * @param {string} username - The username to search for
   * @returns {Promise<User | null>} User object with all fields including password hash, or null if not found
   * @throws {Error} If database query execution fails
   * 
   * @example
   * ```typescript
   * const user = await userRepository.findByUsername('admin');
   * if (user) {
   *   const isValid = await bcrypt.compare(password, user.passwordHash);
   * }
   * ```
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.pool.query(query, [username]);
    
    // Return null if no user found
    if (!result.rows[0]) {
      return null;
    }
    
    // Convert database snake_case to TypeScript camelCase
    const dbRow = result.rows[0];
    return {
      id: dbRow.id,
      username: dbRow.username,
      passwordHash: dbRow.password_hash, // Convert password_hash to passwordHash
      role: dbRow.role,
      employeeId: dbRow.employee_id || null, // Convert employee_id to employeeId
      createdAt: dbRow.created_at, // Convert created_at to createdAt
      updatedAt: dbRow.updated_at, // Convert updated_at to updatedAt
    };
  }

  /**
   * Finds a user by ID without password hash
   * 
   * Retrieves user information excluding the password hash for security.
   * This method is used when displaying user information or for authorization checks.
   * 
   * @param {number} id - The user ID to search for
   * @returns {Promise<UserWithoutPassword | null>} User object without password, or null if not found
   * @throws {Error} If database query execution fails
   * 
   * @example
   * ```typescript
   * const user = await userRepository.findById(123);
   * if (user) {
   *   console.log(`User: ${user.username}, Role: ${user.role}`);
   * }
   * ```
   */
  async findById(id: number): Promise<UserWithoutPassword | null> {
    // Explicitly select columns to exclude password_hash
    const query = `
      SELECT id, username, role, employee_id, created_at, updated_at 
      FROM users 
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    
    // Return null if no user found
    if (!result.rows[0]) {
      return null;
    }
    
    // Convert database snake_case to TypeScript camelCase
    const dbRow = result.rows[0];
    return {
      id: dbRow.id,
      username: dbRow.username,
      role: dbRow.role,
      employeeId: dbRow.employee_id || null, // Convert employee_id to employeeId
      createdAt: dbRow.created_at, // Convert created_at to createdAt
      updatedAt: dbRow.updated_at, // Convert updated_at to updatedAt
    };
  }

  /**
   * Creates a new user in the database
   * 
   * Inserts a new user record and returns the created user data without password hash.
   * The database automatically generates id, created_at, and updated_at timestamps.
   * 
   * @param {Omit<User, 'id' | 'createdAt' | 'updatedAt'>} userData - User data to insert
   * @returns {Promise<UserWithoutPassword>} The newly created user without password hash
   * @throws {Error} If username already exists (unique constraint violation) or insertion fails
   * 
   * @example
   * ```typescript
   * const hashedPassword = await bcrypt.hash('password123', 10);
   * const newUser = await userRepository.create({
   *   username: 'john_doe',
   *   passwordHash: hashedPassword,
   *   role: 'Employee',
   *   employeeId: 5
   * });
   * ```
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserWithoutPassword> {
    const query = `
      INSERT INTO users (username, password_hash, role, employee_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, role, employee_id, created_at, updated_at
    `;
    
    // Map TypeScript camelCase to database snake_case
    const values = [
      userData.username,
      userData.passwordHash,
      userData.role,
      userData.employeeId || null
    ];
    
    const result = await this.pool.query(query, values);
    
    // Convert database snake_case to TypeScript camelCase
    const dbRow = result.rows[0];
    return {
      id: dbRow.id,
      username: dbRow.username,
      role: dbRow.role,
      employeeId: dbRow.employee_id || null, // Convert employee_id to employeeId
      createdAt: dbRow.created_at, // Convert created_at to createdAt
      updatedAt: dbRow.updated_at, // Convert updated_at to updatedAt
    };
  }

  /**
   * Updates user profile information
   * 
   * Updates user data (username, role, employeeId) and returns the updated user without password hash.
   * The updatedAt timestamp is automatically updated by the database.
   * 
   * @param {number} id - The user ID to update
   * @param {Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'>>} userData - User data to update
   * @returns {Promise<UserWithoutPassword>} The updated user without password hash
   * @throws {Error} If user not found, username already exists, or update fails
   */
  async update(id: number, userData: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'>>): Promise<UserWithoutPassword> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (userData.username !== undefined) {
      fields.push(`username = $${paramIndex}`);
      values.push(userData.username);
      paramIndex++;
    }

    if (userData.role !== undefined) {
      fields.push(`role = $${paramIndex}`);
      values.push(userData.role);
      paramIndex++;
    }

    if (userData.employeeId !== undefined) {
      fields.push(`employee_id = $${paramIndex}`);
      values.push(userData.employeeId || null);
      paramIndex++;
    }

    if (fields.length === 0) {
      // No fields to update, return existing user
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('User not found');
      }
      return existing;
    }

    // Add updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause
    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, role, employee_id, created_at, updated_at
    `;

    try {
      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const dbRow = result.rows[0];
      return {
        id: dbRow.id,
        username: dbRow.username,
        role: dbRow.role,
        employeeId: dbRow.employee_id || null,
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at,
      };
    } catch (error: any) {
      // Check for unique constraint violation (username already exists)
      if (error.code === '23505' && error.constraint === 'users_username_key') {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  /**
   * Updates user password
   * 
   * Updates the password hash for a user. The new password should be hashed
   * using bcrypt before calling this method.
   * 
   * @param {number} id - The user ID to update
   * @param {string} newPasswordHash - The new hashed password
   * @returns {Promise<boolean>} True if password was updated successfully, false if user not found
   * @throws {Error} If database update fails
   */
  async updatePassword(id: number, newPasswordHash: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;

    const result = await this.pool.query(query, [newPasswordHash, id]);

    return result.rows.length > 0;
  }

  /**
   * Finds a user by their linked employee ID
   * 
   * @param {number} employeeId - The employee ID to search for
   * @returns {Promise<UserWithoutPassword | null>} User object without password, or null if not found
   */
  async findByEmployeeId(employeeId: number): Promise<UserWithoutPassword | null> {
    const query = `
      SELECT id, username, role, employee_id, created_at, updated_at
      FROM users
      WHERE employee_id = $1
    `;
    const result = await this.pool.query(query, [employeeId]);

    if (!result.rows[0]) {
      return null;
    }

    const dbRow = result.rows[0];
    return {
      id: dbRow.id,
      username: dbRow.username,
      role: dbRow.role,
      employeeId: dbRow.employee_id || null,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }
}

