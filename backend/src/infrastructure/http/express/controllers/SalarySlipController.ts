/**
 * Salary Slip Controller
 * 
 * This controller handles HTTP requests related to salary slip operations.
 * It acts as an adapter between the HTTP layer (Express) and the application
 * layer (Use Cases), translating HTTP requests/responses to/from domain operations.
 * 
 * @module infrastructure/http/express/controllers/SalarySlipController
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Controllers should be thin - they only handle HTTP concerns and delegate
 * business logic to Use Cases.
 */

import { Request, Response } from 'express';
import { GenerateSalarySlipUseCase } from '../../../../application/use-cases/salary-slips/GenerateSalarySlipUseCase';
import { GetSalarySlipUseCase } from '../../../../application/use-cases/salary-slips/GetSalarySlipUseCase';
import { GetSalarySlipsUseCase } from '../../../../application/use-cases/salary-slips/GetSalarySlipsUseCase';
import { SalarySlipRepository } from '../../../database/repositories/SalarySlipRepository';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';
import { AllowanceRepository } from '../../../database/repositories/AllowanceRepository';
import { DeductionRepository } from '../../../database/repositories/DeductionRepository';
import { BonusRepository } from '../../../database/repositories/BonusRepository';
import { EmailService } from '../../../email/EmailService';

/**
 * Salary Slip Controller Class
 * 
 * Handles salary slip-related HTTP endpoints.
 * Initializes use cases and repositories needed for salary slip operations.
 * 
 * @class SalarySlipController
 */
export class SalarySlipController {
  private generateSalarySlipUseCase: GenerateSalarySlipUseCase;
  private getSalarySlipUseCase: GetSalarySlipUseCase;
  private getSalarySlipsUseCase: GetSalarySlipsUseCase;

  /**
   * Creates a new instance of SalarySlipController
   * 
   * Initializes the controller by creating the necessary dependencies:
   * - Repositories for data access
   * - Salary slip use cases for business logic
   */
  constructor() {
    const salarySlipRepository = new SalarySlipRepository();
    const employeeRepository = new EmployeeRepository();
    const allowanceRepository = new AllowanceRepository();
    const deductionRepository = new DeductionRepository();
    const bonusRepository = new BonusRepository();

    this.generateSalarySlipUseCase = new GenerateSalarySlipUseCase(
      salarySlipRepository,
      employeeRepository,
      allowanceRepository,
      deductionRepository,
      bonusRepository
    );
    this.getSalarySlipUseCase = new GetSalarySlipUseCase(salarySlipRepository);
    this.getSalarySlipsUseCase = new GetSalarySlipsUseCase(salarySlipRepository);
  }

  /**
   * Generate salary slip endpoint handler
   * 
   * Handles POST requests to generate a new salary slip for an employee.
   * 
   * @route POST /api/salary-slips/generate
   * @access Protected (requires authentication)
   * @param {Request.body} req.body - Request body containing salary slip data
   * @param {number} req.body.employeeId - Employee ID
   * @param {number} req.body.month - Month (1-12)
   * @param {number} req.body.year - Year
   * @param {Request} req - Express request object (contains user info from auth middleware)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with the generated salary slip
   */
  generate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, month, year } = req.body;

      // Basic validation
      if (!employeeId || !month || !year) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, month, year',
        });
        return;
      }

      // Get user ID from request (set by auth middleware)
      const generatedBy = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Only Admin, HR, or Accountant can generate salary slips
      if (userRole !== 'Admin' && userRole !== 'HR' && userRole !== 'Accountant') {
        res.status(403).json({
          success: false,
          error: 'Only Admin, HR Manager, or Accountant can generate salary slips',
        });
        return;
      }

      const salarySlip = await this.generateSalarySlipUseCase.execute({
        employeeId: parseInt(String(employeeId), 10),
        month: parseInt(String(month), 10),
        year: parseInt(String(year), 10),
        generatedBy,
      });

      // Send email notification to employee
      try {
        const employeeRepository = new EmployeeRepository();
        const employee = await employeeRepository.findById(parseInt(String(employeeId), 10));
        
        if (employee && employee.email) {
          let emailService: EmailService | null = null;
          try {
            emailService = new EmailService();
          } catch (error) {
            console.error('Email service is not configured:', error);
          }

          if (emailService) {
            await emailService.sendSalarySlipNotification({
              to: employee.email,
              fullName: employee.fullName,
              month: parseInt(String(month), 10),
              year: parseInt(String(year), 10),
              netSalary: salarySlip.netSalary,
              slipId: salarySlip.id,
            });
            console.log(`✅ Salary slip notification email sent to ${employee.email}`);
          }
        } else {
          console.warn(`⚠️  Employee ${employeeId} does not have an email address. Email notification skipped.`);
        }
      } catch (emailError: any) {
        console.error('❌ Failed to send salary slip notification email:', emailError.message);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        success: true,
        data: salarySlip,
      });
    } catch (error: any) {
      if (error.message === 'Employee not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to generate salary slip',
      });
    }
  };

  /**
   * Get salary slip by ID endpoint handler
   * 
   * Handles GET requests to retrieve a single salary slip by its ID.
   * 
   * @route GET /api/salary-slips/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Salary slip ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with salary slip data
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid salary slip ID',
        });
        return;
      }

      const salarySlip = await this.getSalarySlipUseCase.execute({ id });

      if (!salarySlip) {
        res.status(404).json({
          success: false,
          error: 'Salary slip not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: salarySlip,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve salary slip',
      });
    }
  };

  /**
   * Get salary slips by employee ID endpoint handler
   * 
   * Handles GET requests to retrieve all salary slips for a specific employee.
   * 
   * @route GET /api/salary-slips/employee/:employeeId
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.employeeId - Employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with salary slips array
   */
  getByEmployeeId = async (req: Request, res: Response): Promise<void> => {
    try {
      const employeeId = parseInt(String(req.params.employeeId), 10);

      if (isNaN(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const salarySlips = await this.getSalarySlipsUseCase.execute({ employeeId });

      res.status(200).json({
        success: true,
        data: salarySlips,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve salary slips',
      });
    }
  };

  /**
   * Get salary slips by month and year endpoint handler
   * 
   * Handles GET requests to retrieve all salary slips for a specific month and year.
   * 
   * @route GET /api/salary-slips?month=X&year=Y
   * @access Protected (requires authentication)
   * @param {Request.query} req.query - Query parameters
   * @param {number} req.query.month - Month (1-12)
   * @param {number} req.query.year - Year
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with salary slips array
   */
  getByMonthYear = async (req: Request, res: Response): Promise<void> => {
    try {
      const month =
        req.query.month !== undefined ? parseInt(String(req.query.month), 10) : undefined;
      const year =
        req.query.year !== undefined ? parseInt(String(req.query.year), 10) : undefined;

      if (!month || !year) {
        res.status(400).json({
          success: false,
          error: 'Missing required query parameters: month, year',
        });
        return;
      }

      const salarySlips = await this.getSalarySlipsUseCase.execute({ month, year });

      res.status(200).json({
        success: true,
        data: salarySlips,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve salary slips',
      });
    }
  };
}

