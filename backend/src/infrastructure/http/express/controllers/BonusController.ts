/**
 * Bonus Controller
 * 
 * This controller handles HTTP requests related to bonus management operations.
 * It acts as an adapter between the HTTP layer (Express) and the application
 * layer (Use Cases), translating HTTP requests/responses to/from domain operations.
 * 
 * @module infrastructure/http/express/controllers/BonusController
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * Controllers should be thin - they only handle HTTP concerns and delegate
 * business logic to Use Cases.
 */

import { Request, Response } from 'express';
import { CreateBonusUseCase } from '../../../../application/use-cases/bonuses/CreateBonusUseCase';
import { GetBonusUseCase } from '../../../../application/use-cases/bonuses/GetBonusUseCase';
import { GetBonusesByEmployeeUseCase } from '../../../../application/use-cases/bonuses/GetBonusesByEmployeeUseCase';
import { UpdateBonusUseCase } from '../../../../application/use-cases/bonuses/UpdateBonusUseCase';
import { DeleteBonusUseCase } from '../../../../application/use-cases/bonuses/DeleteBonusUseCase';
import { BonusRepository } from '../../../database/repositories/BonusRepository';
import { EmployeeRepository } from '../../../database/repositories/EmployeeRepository';

/**
 * Bonus Controller Class
 * 
 * Handles bonus-related HTTP endpoints.
 * Initializes use cases and repositories needed for bonus operations.
 * 
 * @class BonusController
 */
export class BonusController {
  private createBonusUseCase: CreateBonusUseCase;
  private getBonusUseCase: GetBonusUseCase;
  private getBonusesByEmployeeUseCase: GetBonusesByEmployeeUseCase;
  private updateBonusUseCase: UpdateBonusUseCase;
  private deleteBonusUseCase: DeleteBonusUseCase;

  /**
   * Creates a new instance of BonusController
   * 
   * Initializes the controller by creating the necessary dependencies:
   * - BonusRepository and EmployeeRepository for data access
   * - All bonus use cases for business logic
   */
  constructor() {
    const bonusRepository = new BonusRepository();
    const employeeRepository = new EmployeeRepository();
    this.createBonusUseCase = new CreateBonusUseCase(bonusRepository, employeeRepository);
    this.getBonusUseCase = new GetBonusUseCase(bonusRepository);
    this.getBonusesByEmployeeUseCase = new GetBonusesByEmployeeUseCase(bonusRepository, employeeRepository);
    this.updateBonusUseCase = new UpdateBonusUseCase(bonusRepository);
    this.deleteBonusUseCase = new DeleteBonusUseCase(bonusRepository);
  }

  /**
   * Get all bonuses for an employee endpoint handler
   * 
   * Handles GET requests to retrieve all bonuses for a specific employee.
   * 
   * @route GET /api/bonuses/employee/:employeeId
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.employeeId - Employee ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with bonuses array
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

      const bonuses = await this.getBonusesByEmployeeUseCase.execute({ employeeId });

      res.status(200).json({
        success: true,
        data: bonuses,
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
        error: error.message || 'Failed to retrieve bonuses',
      });
    }
  };

  /**
   * Get bonus by ID endpoint handler
   * 
   * Handles GET requests to retrieve a single bonus by its ID.
   * 
   * @route GET /api/bonuses/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Bonus ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with bonus data
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid bonus ID',
        });
        return;
      }

      const bonus = await this.getBonusUseCase.execute({ id });

      if (!bonus) {
        res.status(404).json({
          success: false,
          error: 'Bonus not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: bonus,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to retrieve bonus',
      });
    }
  };

  /**
   * Create bonus endpoint handler
   * 
   * Handles POST requests to create a new bonus for an employee.
   * 
   * @route POST /api/bonuses
   * @access Protected (requires authentication)
   * @param {Request.body} req.body - Bonus data to create
   * @param {number} req.body.employeeId - Employee ID
   * @param {string} req.body.type - Bonus type (e.g., 'performance', 'annual')
   * @param {number} req.body.amount - Bonus amount
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with created bonus
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, type, amount, awardedDate } = req.body;

      // Basic validation
      if (!employeeId || !type || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, type, amount',
        });
        return;
      }

      const bonus = await this.createBonusUseCase.execute({
        employeeId: parseInt(employeeId),
        type,
        amount: parseFloat(amount),
        awardedDate: awardedDate || new Date(), // Default to current date if not provided
      });

      res.status(201).json({
        success: true,
        data: bonus,
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
        error: error.message || 'Failed to create bonus',
      });
    }
  };

  /**
   * Update bonus endpoint handler
   * 
   * Handles PUT requests to update an existing bonus.
   * 
   * @route PUT /api/bonuses/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Bonus ID
   * @param {Request.body} req.body - Bonus data to update (all fields optional)
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with updated bonus
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid bonus ID',
        });
        return;
      }

      const { type, amount } = req.body;

      // Build update data object (only include provided fields)
      const updateData: any = {};

      if (type !== undefined) updateData.type = type;
      if (amount !== undefined) updateData.amount = parseFloat(amount);

      const bonus = await this.updateBonusUseCase.execute({
        id,
        ...updateData,
      });

      res.status(200).json({
        success: true,
        data: bonus,
      });
    } catch (error: any) {
      if (error.message === 'Bonus not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update bonus',
      });
    }
  };

  /**
   * Delete bonus endpoint handler
   * 
   * Handles DELETE requests to delete a bonus.
   * 
   * @route DELETE /api/bonuses/:id
   * @access Protected (requires authentication)
   * @param {Request.params} req.params - Route parameters
   * @param {number} req.params.id - Bonus ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response confirming deletion
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid bonus ID',
        });
        return;
      }

      const deleted = await this.deleteBonusUseCase.execute({ id });

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Bonus not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Bonus deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Bonus not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete bonus',
      });
    }
  };
}

