/**
 * Employee Controller
 * 
 * This controller handles HTTP requests related to employee management operations.
 * It acts as an adapter between the HTTP layer (Express) and the application
 * layer (Use Cases), translating HTTP requests/responses to/from domain operations.
 * 
 * @module infrastructure/http/express/controllers/EmployeeController
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Controllers should be thin - they only handle HTTP concerns and delegate
 * business logic to Use Cases.
 */

import { Request, Response } from 'express';
import { CreateEmployeeUseCase } from '../../../../application/use-cases/employees/CreateEmployeeUseCase';
import { GetEmployeeUseCase } from '../../../../application/use-cases/employees/GetEmployeeUseCase';
import { GetEmployeesUseCase } from '../../../../application/use-cases/employees/GetEmployeesUseCase';
import { UpdateEmployeeUseCase } from '../../../../application/use-cases/employees/UpdateEmployeeUseCase';
import { DeleteEmployeeUseCase } from '../../../../application/use-cases/employees/DeleteEmployeeUseCase';
import { CreateEmployeeAccountUseCase } from '../../../../application/use-cases/employees/CreateEmployeeAccountUseCase';
import { UpdateEmployeeAccountUseCase } from '../../../../application/use-cases/employees/UpdateEmployeeAccountUseCase';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';
import { UserRepository } from '../../../database/repositories/UserRepository';
import { EmailService } from '../../../email/EmailService';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Employee Controller Class
 * 
 * Handles employee-related HTTP endpoints.
 * Initializes use cases and repositories needed for employee operations.
 * 
 * @class EmployeeController
 */
export class EmployeeController {
  private createEmployeeUseCase: CreateEmployeeUseCase;
  private getEmployeeUseCase: GetEmployeeUseCase;
  private getEmployeesUseCase: GetEmployeesUseCase;
  private updateEmployeeUseCase: UpdateEmployeeUseCase;
  private deleteEmployeeUseCase: DeleteEmployeeUseCase;
  private userRepository: UserRepository;
  private employeeRepository: EmployeeRepository;

  /**
   * Creates a new instance of EmployeeController
   * 
   * Initializes the controller by creating the necessary dependencies:
   * - EmployeeRepository for data access
   * - All employee use cases for business logic
   */
  constructor() {
    const employeeRepository = new EmployeeRepository();
    const userRepository = new UserRepository();

    this.createEmployeeUseCase = new CreateEmployeeUseCase(employeeRepository);
    this.getEmployeeUseCase = new GetEmployeeUseCase(employeeRepository);
    this.getEmployeesUseCase = new GetEmployeesUseCase(employeeRepository);
    this.updateEmployeeUseCase = new UpdateEmployeeUseCase(employeeRepository);
    this.deleteEmployeeUseCase = new DeleteEmployeeUseCase(employeeRepository);
    this.userRepository = userRepository;
    this.employeeRepository = employeeRepository;
  }

  /**
   * Get all employees endpoint handler
   * 
   * Handles GET requests to retrieve a list of employees with optional filtering and pagination.
   * 
   * @route GET /api/employees
   * @access Protected (requires authentication)
   * @param {Request.query} req.query - Query parameters for filtering and pagination
   * @param {string} req.query.search - Search term (name, email, department)
   * @param {string} req.query.department - Filter by department
   * @param {string} req.query.status - Filter by status (Active, Inactive, Terminated)
   * @param {number} req.query.page - Page number (default: 1)
   * @param {number} req.query.limit - Items per page (default: 10)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with paginated employees
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, department, status, page, limit } = req.query;

      const result = await this.getEmployeesUseCase.execute({
        search: search !== undefined ? String(search) : undefined,
        department: department !== undefined ? String(department) : undefined,
        status:
          status !== undefined
            ? (String(status) as 'Active' | 'Inactive' | 'Terminated')
            : undefined,
        page: page !== undefined ? parseInt(String(page), 10) : undefined,
        limit: limit !== undefined ? parseInt(String(limit), 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve employees',
      });
    }
  };

  /**
   * Get employee by ID endpoint handler
   * 
   * Handles GET requests to retrieve a single employee by their ID.
   * 
   * @route GET /api/employees/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with employee data
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const employee = await this.getEmployeeUseCase.execute(id);

      if (!employee) {
        res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
        return;
      }

      const userAccount = await this.userRepository.findByEmployeeId(id);

      res.status(200).json({
        success: true,
        data: {
          ...employee,
          userAccount: userAccount
            ? {
                id: userAccount.id,
                username: userAccount.username,
                role: userAccount.role,
              }
            : null,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve employee',
      });
    }
  };

  /**
   * Create employee account endpoint handler
   * 
   * Handles POST requests to create a login account for an employee.
   * 
   * @route POST /api/employees/:id/account
   * @access Protected (admin only)
   */
  createAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      if (isNaN(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const { username, password, role, email } = req.body;
      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
        return;
      }

      const adminUserId = req.user?.id;
      if (!adminUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      let emailService: EmailService | null = null;
      try {
        emailService = new EmailService();
      } catch (error) {
        console.error('Email service is not configured:', error);
      }
      const createEmployeeAccountUseCase = new CreateEmployeeAccountUseCase(
        this.userRepository,
        this.employeeRepository,
        emailService
      );

      const result = await createEmployeeAccountUseCase.execute(adminUserId, {
        employeeId,
        username,
        password,
        role: role || 'Employee',
        email: email || null,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: result.emailSent
          ? 'Account created and email sent successfully. Please check spam folder if not received.'
          : 'Account created, but email delivery failed. Please check server logs for details.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create account',
      });
    }
  };

  /**
   * Update employee account endpoint handler
   *
   * Handles PUT requests to update a login account for an employee.
   *
   * @route PUT /api/employees/:id/account
   * @access Protected (admin only)
   */
  updateAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const employeeId = parseInt(String(req.params.id), 10);
      if (isNaN(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const { username, password, role, email } = req.body;
      if (!username && !password && !role && email === undefined) {
        res.status(400).json({
          success: false,
          error: 'No fields provided for update',
        });
        return;
      }

      const adminUserId = req.user?.id;
      if (!adminUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      let emailService: EmailService | null = null;
      try {
        emailService = new EmailService();
      } catch (error) {
        console.error('Email service is not configured:', error);
      }

      const updateEmployeeAccountUseCase = new UpdateEmployeeAccountUseCase(
        this.userRepository,
        this.employeeRepository,
        emailService
      );

      const result = await updateEmployeeAccountUseCase.execute(adminUserId, {
        employeeId,
        username,
        password,
        role,
        email: email || null,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.emailSent
          ? 'Account updated and email sent successfully'
          : 'Account updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update account',
      });
    }
  };

  /**
   * Create employee endpoint handler
   * 
   * Handles POST requests to create a new employee.
   * 
   * @route POST /api/employees
   * @access Protected (requires authentication)
   * @param {Request.body} req.body - Employee data to create
   * @param {string} req.body.fullName - Employee's full name
   * @param {string} req.body.email - Employee's email (optional)
   * @param {string} req.body.phone - Employee's phone (optional)
   * @param {string} req.body.department - Employee's department
   * @param {string} req.body.position - Employee's position
   * @param {Date} req.body.hireDate - Employee's hire date
   * @param {number} req.body.basicSalary - Employee's basic salary
   * @param {string} req.body.status - Employee's status (optional, default: Active)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with created employee
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        fullName,
        email,
        phone,
        department,
        position,
        hireDate,
        basicSalary,
        status,
      } = req.body;

      // Basic validation
      if (!fullName || !department || !position || !hireDate || basicSalary === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: fullName, department, position, hireDate, basicSalary',
        });
        return;
      }

      const employee = await this.createEmployeeUseCase.execute({
        fullName,
        email,
        phone,
        department,
        position,
        hireDate: new Date(hireDate),
        basicSalary: parseFloat(basicSalary),
        status,
      });

      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create employee',
      });
    }
  };

  /**
   * Update employee endpoint handler
   * 
   * Handles PUT requests to update an existing employee.
   * 
   * @route PUT /api/employees/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Employee ID
   * @param {Request.body} req.body - Employee data to update (all fields optional)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with updated employee
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const {
        fullName,
        email,
        phone,
        department,
        position,
        hireDate,
        basicSalary,
        status,
      } = req.body;

      // Build update data object (only include provided fields)
      const updateData: any = {};

      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (department !== undefined) updateData.department = department;
      if (position !== undefined) updateData.position = position;
      if (hireDate !== undefined) updateData.hireDate = new Date(hireDate);
      if (basicSalary !== undefined) updateData.basicSalary = parseFloat(basicSalary);
      if (status !== undefined) updateData.status = status;

      const employee = await this.updateEmployeeUseCase.execute(id, updateData);

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      if (error.message === 'Employee not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update employee',
      });
    }
  };

  /**
   * Delete employee endpoint handler
   * 
   * Handles DELETE requests to delete an employee.
   * 
   * @route DELETE /api/employees/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response confirming deletion
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const deleted = await this.deleteEmployeeUseCase.execute(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Employee not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete employee',
      });
    }
  };
}

