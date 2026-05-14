/**
 * Interface for Salary Slip Repository operations.
 * Defines the contract for interacting with salary slip data persistence.
 * @interface ISalarySlipRepository
 */
import { SalarySlip } from '../entities/SalarySlip';

export interface ISalarySlipRepository {
  /**
   * Finds all salary slips for a specific employee.
   * @param {number} employeeId - The ID of the employee.
   * @returns {Promise<SalarySlip[]>} A promise that resolves to an array of SalarySlip objects.
   */
  findByEmployeeId(employeeId: number): Promise<SalarySlip[]>;

  /**
   * Finds a salary slip by its ID.
   * @param {number} id - The ID of the salary slip to search for.
   * @returns {Promise<SalarySlip | null>} A promise that resolves to the SalarySlip object if found, otherwise null.
   */
  findById(id: number): Promise<SalarySlip | null>;

  /**
   * Finds a salary slip by employee ID, month, and year.
   * @param {number} employeeId - The ID of the employee.
   * @param {number} month - The month (1-12).
   * @param {number} year - The year.
   * @returns {Promise<SalarySlip | null>} A promise that resolves to the SalarySlip object if found, otherwise null.
   */
  findByEmployeeMonthYear(employeeId: number, month: number, year: number): Promise<SalarySlip | null>;

  /**
   * Finds all salary slips for a specific month and year.
   * @param {number} month - The month (1-12).
   * @param {number} year - The year.
   * @returns {Promise<SalarySlip[]>} A promise that resolves to an array of SalarySlip objects.
   */
  findByMonthYear(month: number, year: number): Promise<SalarySlip[]>;

  /**
   * Creates a new salary slip.
   * @param {Omit<SalarySlip, 'id' | 'generatedAt'>} slipData - The salary slip data to create, excluding auto-generated fields.
   * @returns {Promise<SalarySlip>} A promise that resolves to the created SalarySlip object.
   */
  create(slipData: Omit<SalarySlip, 'id' | 'generatedAt'>): Promise<SalarySlip>;

  /**
   * Deletes a salary slip by its ID.
   * @param {number} id - The ID of the salary slip to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the salary slip was deleted, otherwise false.
   */
  delete(id: number): Promise<boolean>;

  /**
   * Gets unique month/year combinations for monthly reports.
   * @param {number | undefined} year - Optional year filter
   * @returns {Promise<Array<{ month: number; year: number; generatedAt: Date }>>}
   */
  getMonthlyReportHistory(year?: number): Promise<Array<{ month: number; year: number; generatedAt: Date }>>;

  /**
   * Gets unique years for annual reports.
   * @param {number | undefined} year - Optional year filter
   * @returns {Promise<Array<{ year: number; generatedAt: Date }>>}
   */
  getAnnualReportHistory(year?: number): Promise<Array<{ year: number; generatedAt: Date }>>;
}

