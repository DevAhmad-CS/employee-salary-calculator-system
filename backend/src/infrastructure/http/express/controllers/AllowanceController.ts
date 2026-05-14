/**
 * Allowance Controller
 * 
 * This controller handles HTTP requests related to allowance management operations.
 * It acts as an adapter between the HTTP layer (Express) and the application
 * layer (Use Cases), translating HTTP requests/responses to/from domain operations.
 * 
 * @module infrastructure/http/express/controllers/AllowanceController
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Controllers should be thin - they only handle HTTP concerns and delegate
 * business logic to Use Cases.
 */

import { Request, Response } from 'express';
import { CreateAllowanceUseCase } from '../../../../application/use-cases/allowances/CreateAllowanceUseCase';
import { GetAllowanceUseCase } from '../../../../application/use-cases/allowances/GetAllowanceUseCase';
import { GetAllowancesByEmployeeUseCase } from '../../../../application/use-cases/allowances/GetAllowancesByEmployeeUseCase';
import { UpdateAllowanceUseCase } from '../../../../application/use-cases/allowances/UpdateAllowanceUseCase';
import { DeleteAllowanceUseCase } from '../../../../application/use-cases/allowances/DeleteAllowanceUseCase';
import { AllowanceRepository } from '../../../database/repositories/AllowanceRepository';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';

/**
 * Allowance Controller Class
 * 
 * Handles allowance-related HTTP endpoints.
 * Initializes use cases and repositories needed for allowance operations.
 * 
 * @class AllowanceController
 */
export class AllowanceController {
  private createAllowanceUseCase: CreateAllowanceUseCase;
  private getAllowanceUseCase: GetAllowanceUseCase;
  private getAllowancesByEmployeeUseCase: GetAllowancesByEmployeeUseCase;
  private updateAllowanceUseCase: UpdateAllowanceUseCase;
  private deleteAllowanceUseCase: DeleteAllowanceUseCase;

  /**
   * Creates a new instance of AllowanceController
   * 
   * Initializes the controller by creating the necessary dependencies:
   * - AllowanceRepository and EmployeeRepository for data access
   * - All allowance use cases for business logic
   */
  constructor() {
    const allowanceRepository = new AllowanceRepository();
    const employeeRepository = new EmployeeRepository();
    this.createAllowanceUseCase = new CreateAllowanceUseCase(allowanceRepository, employeeRepository);
    this.getAllowanceUseCase = new GetAllowanceUseCase(allowanceRepository);
    this.getAllowancesByEmployeeUseCase = new GetAllowancesByEmployeeUseCase(allowanceRepository, employeeRepository);
    this.updateAllowanceUseCase = new UpdateAllowanceUseCase(allowanceRepository);
    this.deleteAllowanceUseCase = new DeleteAllowanceUseCase(allowanceRepository);
  }

  /**
   * Get all allowances for an employee endpoint handler
   * 
   * Handles GET requests to retrieve all allowances for a specific employee.
   * 
   * @route GET /api/allowances/employee/:employeeId
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.employeeId - Employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with allowances array
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

      const allowances = await this.getAllowancesByEmployeeUseCase.execute({ employeeId });

      res.status(200).json({
        success: true,
        data: allowances,
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
        error: error.message || 'Failed to retrieve allowances',
      });
    }
  };

  /**
   * Get allowance by ID endpoint handler
   * 
   * Handles GET requests to retrieve a single allowance by its ID.
   * 
   * @route GET /api/allowances/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Allowance ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with allowance data
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid allowance ID',
        });
        return;
      }

      const allowance = await this.getAllowanceUseCase.execute({ id });

      if (!allowance) {
        res.status(404).json({
          success: false,
          error: 'Allowance not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: allowance,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve allowance',
      });
    }
  };

  /**
   * Create allowance endpoint handler
   * 
   * Handles POST requests to create a new allowance for an employee.
   * 
   * @route POST /api/allowances
   * @access Protected (requires authentication)
   * @param {Request.body} req.body - Allowance data to create
   * @param {number} req.body.employeeId - Employee ID
   * @param {string} req.body.type - Allowance type (e.g., 'transport', 'housing')
   * @param {number} req.body.amount - Allowance amount
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with created allowance
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, type, amount } = req.body;

      // Basic validation
      if (!employeeId || !type || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, type, amount',
        });
        return;
      }

      const allowance = await this.createAllowanceUseCase.execute({
        employeeId: parseInt(employeeId),
        type,
        amount: parseFloat(amount),
      });

      res.status(201).json({
        success: true,
        data: allowance,
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
        error: error.message || 'Failed to create allowance',
      });
    }
  };

  /**
   * Update allowance endpoint handler
   * 
   * Handles PUT requests to update an existing allowance.
   * 
   * @route PUT /api/allowances/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Allowance ID
   * @param {Request.body} req.body - Allowance data to update (all fields optional)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with updated allowance
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid allowance ID',
        });
        return;
      }

      const { type, amount } = req.body;

      // Build update data object (only include provided fields)
      const updateData: any = {};

      if (type !== undefined) updateData.type = type;
      if (amount !== undefined) updateData.amount = parseFloat(amount);

      const allowance = await this.updateAllowanceUseCase.execute({
        id,
        ...updateData,
      });

      res.status(200).json({
        success: true,
        data: allowance,
      });
    } catch (error: any) {
      if (error.message === 'Allowance not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update allowance',
      });
    }
  };

  /**
   * Delete allowance endpoint handler
   * 
   * Handles DELETE requests to delete an allowance.
   * 
   * @route DELETE /api/allowances/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Allowance ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response confirming deletion
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid allowance ID',
        });
        return;
      }

      const deleted = await this.deleteAllowanceUseCase.execute({ id });

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Allowance not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Allowance deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Allowance not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete allowance',
      });
    }
  };
}

