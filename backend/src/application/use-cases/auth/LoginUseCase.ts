/**
 * Login Use Case
 * 
 * This module implements the login business logic following Clean Architecture principles.
 * It handles user authentication by verifying credentials and generating JWT tokens.
 * 
 * @module application/use-cases/auth/LoginUseCase
 * 
 * @remarks
 * This is part of the Application Layer (Use Cases) in Clean Architecture.
 * It orchestrates domain logic and infrastructure dependencies without knowing
 * implementation details of data persistence or external services.
 * 
 * @example
 * ```typescript
 * const userRepository = new UserRepository();
 * const loginUseCase = new LoginUseCase(userRepository);
 * 
 * const result = await loginUseCase.execute({
 *   username: 'john_doe',
 *   password: 'password123'
 * });
 * ```
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { User } from '../../../domain/entities/User';

/**
 * Request payload for login operation
 * 
 * @interface LoginRequest
 * @property {string} username - User's username
 * @property {string} password - User's plain text password (will be hashed and compared)
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response payload for successful login
 * 
 * @interface LoginResponse
 * @property {Object} user - User information without sensitive data
 * @property {number} user.id - User ID
 * @property {string} user.username - Username
 * @property {string} user.role - User role (Admin, Accountant, Employee, Management)
 * @property {string} token - JWT authentication token
 */
export interface LoginResponse {
  user: {
    id: number;
    username: string;
    role: string;
  };
  token: string;
}

/**
 * Login Use Case Implementation
 * 
 * Handles the complete login flow:
 * 1. Validates user credentials (username and password)
 * 2. Verifies password hash using bcrypt
 * 3. Generates JWT token for authenticated sessions
 * 4. Returns user information and authentication token
 * 
 * @class LoginUseCase
 * 
 * @example
 * ```typescript
 * const loginUseCase = new LoginUseCase(userRepository);
 * 
 * try {
 *   const result = await loginUseCase.execute({
 *     username: 'admin',
 *     password: 'secret123'
 *   });
 *   // Use result.token for authenticated requests
 * } catch (error) {
 *   // Handle invalid credentials
 * }
 * ```
 */
export class LoginUseCase {
  /**
   * Creates a new instance of LoginUseCase
   * 
   * @param {IUserRepository} userRepository - Repository for user data access
   */
  constructor(private userRepository: IUserRepository) {}

  /**
   * Executes the login use case
   * 
   * Performs the complete authentication flow:
   * 1. Retrieves user by username
   * 2. Validates user exists
   * 3. Compares provided password with stored hash
   * 4. Generates JWT token with user information
   * 5. Returns user data and token
   * 
   * @param {LoginRequest} request - Login credentials
   * @returns {Promise<LoginResponse>} User information and JWT token
   * @throws {Error} If username doesn't exist or password is incorrect
   * 
   * @example
   * ```typescript
   * const response = await loginUseCase.execute({
   *   username: 'john_doe',
   *   password: 'myPassword123'
   * });
   * 
   * // response.user contains { id, username, role }
   * // response.token contains JWT token string
   * ```
   */
  async execute(request: LoginRequest): Promise<LoginResponse> {
    // Step 1: Find user by username
    // This retrieves the user with password hash for verification
    const user = await this.userRepository.findByUsername(request.username);
    
    // Step 2: Validate user exists
    // Throw generic error to prevent username enumeration attacks
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Step 3: Verify password
    // Compare plain text password with stored bcrypt hash
    // bcrypt.compare handles the hashing and comparison securely
    const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Step 4: Generate JWT token
    // Token contains user ID, username, and role for authorization
    // Expiration is set from environment variable (default: 7 days)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: expiresIn,
      } as jwt.SignOptions
    );

    // Step 5: Return response with user data (without password) and token
    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      token,
    };
  }
}

