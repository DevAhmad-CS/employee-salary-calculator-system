/**
 * Authentication Controller
 * 
 * This controller handles HTTP requests related to authentication operations.
 * It acts as an adapter between the HTTP layer (Express) and the application
 * layer (Use Cases), translating HTTP requests/responses to/from domain operations.
 * 
 * @module infrastructure/http/express/controllers/AuthController
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Controllers should be thin - they only handle HTTP concerns and delegate
 * business logic to Use Cases.
 * 
 * @example
 * ```typescript
 * const authController = new AuthController();
 * 
 * // In routes:
 * router.post('/login', authController.login);
 * ```
 */

import { Request, Response } from 'express';
import { LoginUseCase } from '../../../../application/use-cases/auth/LoginUseCase';
import { CreateUserAccountUseCase } from '../../../../application/use-cases/users/CreateUserAccountUseCase';
import { UserRepository } from '../../../database/repositories/UserRepository';
import { EmailService } from '../../../email/EmailService';

/**
 * Authentication Controller Class
 * 
 * Handles authentication-related HTTP endpoints.
 * Initializes use cases and repositories needed for authentication operations.
 * 
 * @class AuthController
 */
export class AuthController {
  /**
   * Login use case instance
   * 
   * Handles the business logic for user authentication.
   * 
   * @private
   * @type {LoginUseCase}
   */
  private loginUseCase: LoginUseCase;

  /**
   * Creates a new instance of AuthController
   * 
   * Initializes the controller by creating the necessary dependencies:
   * - UserRepository for data access
   * - LoginUseCase for authentication logic
   * 
   * @constructor
   */
  constructor() {
    // Initialize repository and use case
    // In a larger application, you might use dependency injection here
    const userRepository = new UserRepository();
    this.loginUseCase = new LoginUseCase(userRepository);
  }

  /**
   * Login endpoint handler
   * 
   * Handles POST requests to authenticate a user.
   * Validates input, executes the login use case, and returns appropriate HTTP responses.
   * 
   * @route POST /api/auth/login
   * @param {Request} req - Express request object
   * @param {Request.body} req.body - Request body containing credentials
   * @param {string} req.body.username - User's username
   * @param {string} req.body.password - User's plain text password
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response, doesn't return a value
   * 
   * @example
   * ```typescript
   * // Request:
   * POST /api/auth/login
   * Body: { "username": "john_doe", "password": "password123" }
   * 
   * // Success Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "user": { "id": 1, "username": "john_doe", "role": "Employee" },
   *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *   }
   * }
   * 
   * // Error Response (400):
   * {
   *   "success": false,
   *   "error": "Username and password are required"
   * }
   * 
   * // Error Response (401):
   * {
   *   "success": false,
   *   "error": "Invalid credentials"
   * }
   * ```
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract credentials from request body
      const { username, password } = req.body;

      // Validate input - ensure both fields are provided
      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
        return;
      }

      // Check JWT_SECRET before attempting login
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET is missing in login handler!');
        res.status(500).json({
          success: false,
          error: 'Server configuration error',
        });
        return;
      }

      // Execute the login use case
      // This handles password verification and JWT token generation
      const result = await this.loginUseCase.execute({ username, password });

      // Return success response with user data and token
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      // Log error for debugging
      console.error('Login error:', error.message);
      
      // Handle authentication errors
      // Use 401 (Unauthorized) for invalid credentials
      // The error message is sanitized to prevent information leakage
      res.status(401).json({
        success: false,
        error: error.message || 'Authentication failed',
      });
    }
  };

  /**
   * Get user by ID endpoint handler
   * 
   * Handles GET requests to retrieve a user by their ID (without password).
   * 
   * @route GET /api/auth/users/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - User ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with user data
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
        });
        return;
      }

      const userRepository = new UserRepository();
      const user = await userRepository.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve user',
      });
    }
  };

  /**
   * Create user account endpoint handler
   * 
   * Handles POST requests to create a standalone user account (without requiring an employee).
   * Used for creating Admin, HR, Accountant, or Management accounts.
   * 
   * @route POST /api/auth/users
   * @access Protected (admin only)
   * @param {Request} req - Express request object
   * @param {Request.body} req.body - Request body containing user data
   * @param {string} req.body.username - Username
   * @param {string} req.body.password - Plain text password
   * @param {string} req.body.role - User role (Admin, HR, Accountant, Employee, Management)
   * @param {string} req.body.email - Email address for sending credentials
   * @param {number} [req.body.employeeId] - Optional employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with created user data
   */
  createUserAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password, role, email, employeeId } = req.body;
      const adminUserId = (req as any).user?.id;

      // Validate input
      if (!username || !password || !role || !email) {
        res.status(400).json({
          success: false,
          error: 'Username, password, role, and email are required',
        });
        return;
      }

      if (!adminUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Initialize dependencies
      const userRepository = new UserRepository();
      let emailService: EmailService | null = null;
      try {
        emailService = new EmailService();
      } catch (error) {
        console.error('Email service is not configured:', error);
      }

      const createUserAccountUseCase = new CreateUserAccountUseCase(
        userRepository,
        emailService
      );

      const result = await createUserAccountUseCase.execute(adminUserId, {
        username,
        password,
        role,
        email,
        employeeId: employeeId || null,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: result.emailSent
          ? 'User account created and email sent successfully. Please check spam/junk folder if not received.'
          : 'User account created, but email delivery failed. Please check server logs for details.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create user account',
      });
    }
  };
}

