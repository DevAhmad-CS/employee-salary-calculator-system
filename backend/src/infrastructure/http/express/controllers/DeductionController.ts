/**
 * Deduction Controller
 * 
 * This controller handles HTTP requests related to deduction management operations.
 * It acts as an adapter between the HTTP layer (Express) and the application
 * layer (Use Cases), translating HTTP requests/responses to/from domain operations.
 * 
 * @module infrastructure/http/express/controllers/DeductionController
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Controllers should be thin - they only handle HTTP concerns and delegate
 * business logic to Use Cases.
 */

import { Request, Response } from 'express';
import { CreateDeductionUseCase } from '../../../../application/use-cases/deductions/CreateDeductionUseCase';
import { GetDeductionUseCase } from '../../../../application/use-cases/deductions/GetDeductionUseCase';
import { GetDeductionsByEmployeeUseCase } from '../../../../application/use-cases/deductions/GetDeductionsByEmployeeUseCase';
import { UpdateDeductionUseCase } from '../../../../application/use-cases/deductions/UpdateDeductionUseCase';
import { DeleteDeductionUseCase } from '../../../../application/use-cases/deductions/DeleteDeductionUseCase';
import { DeductionRepository } from '../../../database/repositories/DeductionRepository';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';

/**
 * Deduction Controller Class
 * 
 * Handles deduction-related HTTP endpoints.
 * Initializes use cases and repositories needed for deduction operations.
 * 
 * @class DeductionController
 */
export class DeductionController {
  private createDeductionUseCase: CreateDeductionUseCase;
  private getDeductionUseCase: GetDeductionUseCase;
  private getDeductionsByEmployeeUseCase: GetDeductionsByEmployeeUseCase;
  private updateDeductionUseCase: UpdateDeductionUseCase;
  private deleteDeductionUseCase: DeleteDeductionUseCase;

  /**
   * Creates a new instance of DeductionController
   * 
   * Initializes the controller by creating the necessary dependencies:
   * - DeductionRepository and EmployeeRepository for data access
   * - All deduction use cases for business logic
   */
  constructor() {
    const deductionRepository = new DeductionRepository();
    const employeeRepository = new EmployeeRepository();
    this.createDeductionUseCase = new CreateDeductionUseCase(deductionRepository, employeeRepository);
    this.getDeductionUseCase = new GetDeductionUseCase(deductionRepository);
    this.getDeductionsByEmployeeUseCase = new GetDeductionsByEmployeeUseCase(deductionRepository, employeeRepository);
    this.updateDeductionUseCase = new UpdateDeductionUseCase(deductionRepository);
    this.deleteDeductionUseCase = new DeleteDeductionUseCase(deductionRepository);
  }

  /**
   * Get all deductions for an employee endpoint handler
   * 
   * Handles GET requests to retrieve all deductions for a specific employee.
   * 
   * @route GET /api/deductions/employee/:employeeId
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.employeeId - Employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with deductions array
   */
  getByEmployeeId = async (req: Request, res: Response): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.employeeId);

      if (isNaN(employeeId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid employee ID',
        });
        return;
      }

      const deductions = await this.getDeductionsByEmployeeUseCase.execute({ employeeId });

      res.status(200).json({
        success: true,
        data: deductions,
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
        error: error.message || 'Failed to retrieve deductions',
      });
    }
  };

  /**
   * Get deduction by ID endpoint handler
   * 
   * Handles GET requests to retrieve a single deduction by its ID.
   * 
   * @route GET /api/deductions/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Deduction ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with deduction data
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid deduction ID',
        });
        return;
      }

      const deduction = await this.getDeductionUseCase.execute({ id });

      if (!deduction) {
        res.status(404).json({
          success: false,
          error: 'Deduction not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deduction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve deduction',
      });
    }
  };

  /**
   * Create deduction endpoint handler
   * 
   * Handles POST requests to create a new deduction for an employee.
   * 
   * @route POST /api/deductions
   * @access Protected (requires authentication)
   * @param {Request.body} req.body - Deduction data to create
   * @param {number} req.body.employeeId - Employee ID
   * @param {string} req.body.type - Deduction type (e.g., 'tax', 'insurance')
   * @param {number} req.body.amount - Deduction amount
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with created deduction
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

      const deduction = await this.createDeductionUseCase.execute({
        employeeId: parseInt(employeeId),
        type,
        amount: parseFloat(amount),
      });

      res.status(201).json({
        success: true,
        data: deduction,
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
        error: error.message || 'Failed to create deduction',
      });
    }
  };

  /**
   * Update deduction endpoint handler
   * 
   * Handles PUT requests to update an existing deduction.
   * 
   * @route PUT /api/deductions/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Deduction ID
   * @param {Request.body} req.body - Deduction data to update (all fields optional)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with updated deduction
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid deduction ID',
        });
        return;
      }

      const { type, amount } = req.body;

      // Build update data object (only include provided fields)
      const updateData: any = {};

      if (type !== undefined) updateData.type = type;
      if (amount !== undefined) updateData.amount = parseFloat(amount);

      const deduction = await this.updateDeductionUseCase.execute({
        id,
        ...updateData,
      });

      res.status(200).json({
        success: true,
        data: deduction,
      });
    } catch (error: any) {
      if (error.message === 'Deduction not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update deduction',
      });
    }
  };

  /**
   * Delete deduction endpoint handler
   * 
   * Handles DELETE requests to delete a deduction.
   * 
   * @route DELETE /api/deductions/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Deduction ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response confirming deletion
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid deduction ID',
        });
        return;
      }

      const deleted = await this.deleteDeductionUseCase.execute({ id });

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Deduction not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Deduction deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Deduction not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete deduction',
      });
    }
  };
}

