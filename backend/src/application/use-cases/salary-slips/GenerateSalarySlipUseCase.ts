/**
 * Generate Salary Slip Use Case.
 * Handles the business logic for generating a salary slip for an employee.
 * @class GenerateSalarySlipUseCase
 */
import { ISalarySlipRepository } from '../../../domain/interfaces/ISalarySlipRepository';
import { IEmployeeRepository } from '../../../domain/interfaces/IEmployeeRepository';
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';
import { SalarySlip } from '../../../domain/entities/SalarySlip';

/**
 * Interface for the Generate Salary Slip Use Case request data.
 * @interface GenerateSalarySlipRequest
 */
export interface GenerateSalarySlipRequest {
  employeeId: number;
  month: number; // 1-12
  year: number;
  generatedBy?: number; // User ID who generated the slip
}

export class GenerateSalarySlipUseCase {
  /**
   * Creates an instance of GenerateSalarySlipUseCase.
   * @param {ISalarySlipRepository} salarySlipRepository - The salary slip repository to interact with salary slip data.
   * @param {IEmployeeRepository} employeeRepository - The employee repository to get employee data.
   * @param {IAllowanceRepository} allowanceRepository - The allowance repository to get allowances.
   * @param {IDeductionRepository} deductionRepository - The deduction repository to get deductions.
   * @param {IBonusRepository} bonusRepository - The bonus repository to get bonuses.
   */
  constructor(
    private salarySlipRepository: ISalarySlipRepository,
    private employeeRepository: IEmployeeRepository,
    private allowanceRepository: IAllowanceRepository,
    private deductionRepository: IDeductionRepository,
    private bonusRepository: IBonusRepository
  ) {}

  /**
   * Executes the salary slip generation process.
   * @param {GenerateSalarySlipRequest} request - The request containing employee ID, month, and year.
   * @returns {Promise<SalarySlip>} A promise that resolves to the generated SalarySlip object.
   * @throws {Error} If validation fails, employee not found, or slip already exists.
   */
  async execute(request: GenerateSalarySlipRequest): Promise<SalarySlip> {
    // Validate input
    if (!request.employeeId || request.employeeId <= 0) {
      throw new Error('Invalid employee ID.');
    }
    if (!request.month || request.month < 1 || request.month > 12) {
      throw new Error('Invalid month. Month must be between 1 and 12.');
    }
    if (!request.year || request.year < 2000 || request.year > 3000) {
      throw new Error('Invalid year.');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(request.employeeId);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Check if salary slip already exists for this month/year
    const existingSlip = await this.salarySlipRepository.findByEmployeeMonthYear(
      request.employeeId,
      request.month,
      request.year
    );
    if (existingSlip) {
      throw new Error(`Salary slip already exists for employee ${request.employeeId} for ${request.month}/${request.year}.`);
    }

    // Get all allowances, deductions, and bonuses for the employee
    const allowances = await this.allowanceRepository.findByEmployeeId(request.employeeId);
    const deductions = await this.deductionRepository.findByEmployeeId(request.employeeId);
    const bonuses = await this.bonusRepository.findByEmployeeId(request.employeeId);

    // Calculate totals
    const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
    const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

    // Calculate net salary
    const netSalary = employee.basicSalary + totalAllowances + totalBonus - totalDeductions;

    // Create salary slip
    const newSlip: Omit<SalarySlip, 'id' | 'generatedAt'> = {
      employeeId: request.employeeId,
      month: request.month,
      year: request.year,
      basicSalary: employee.basicSalary,
      totalAllowances,
      totalBonus,
      totalDeductions,
      netSalary,
      generatedBy: request.generatedBy,
    };

    return this.salarySlipRepository.create(newSlip);
  }
}

