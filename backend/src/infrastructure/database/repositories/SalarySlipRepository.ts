/**
 * PostgreSQL implementation of ISalarySlipRepository.
 * This class handles database operations for SalarySlip entities using a PostgreSQL pool.
 * @class SalarySlipRepository
 * @implements {ISalarySlipRepository}
 */
import { Pool } from 'pg';
import { ISalarySlipRepository } from '../../../domain/interfaces/ISalarySlipRepository';
import { SalarySlip } from '../../../domain/entities/SalarySlip';
import { pool } from '../postgres/connection';

export class SalarySlipRepository implements ISalarySlipRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Maps database row (snake_case) to SalarySlip entity (camelCase).
   * @private
   * @param {any} row - Database row object
   * @returns {SalarySlip} Mapped SalarySlip entity
   */
  private mapRowToSalarySlip(row: any): SalarySlip {
    return {
      id: row.id,
      employeeId: row.employee_id,
      month: row.month,
      year: row.year,
      basicSalary: parseFloat(row.basic_salary),
      totalAllowances: parseFloat(row.total_allowances),
      totalBonus: parseFloat(row.total_bonus),
      totalDeductions: parseFloat(row.total_deductions),
      netSalary: parseFloat(row.net_salary),
      generatedAt: new Date(row.generated_at),
      generatedBy: row.generated_by || undefined,
    };
  }

  async findByEmployeeId(employeeId: number): Promise<SalarySlip[]> {
    const query = 'SELECT * FROM salary_slips WHERE employee_id = $1 ORDER BY year DESC, month DESC';
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(this.mapRowToSalarySlip);
  }

  async findById(id: number): Promise<SalarySlip | null> {
    const query = 'SELECT * FROM salary_slips WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToSalarySlip(result.rows[0]) : null;
  }

  async findByEmployeeMonthYear(employeeId: number, month: number, year: number): Promise<SalarySlip | null> {
    const query = 'SELECT * FROM salary_slips WHERE employee_id = $1 AND month = $2 AND year = $3';
    const result = await this.pool.query(query, [employeeId, month, year]);
    return result.rows[0] ? this.mapRowToSalarySlip(result.rows[0]) : null;
  }

  async findByMonthYear(month: number, year: number): Promise<SalarySlip[]> {
    const query = 'SELECT * FROM salary_slips WHERE month = $1 AND year = $2 ORDER BY employee_id ASC';
    const result = await this.pool.query(query, [month, year]);
    return result.rows.map(this.mapRowToSalarySlip);
  }

  async create(slipData: Omit<SalarySlip, 'id' | 'generatedAt'>): Promise<SalarySlip> {
    const query = `
      INSERT INTO salary_slips (employee_id, month, year, basic_salary, total_allowances, total_bonus, total_deductions, net_salary, generated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      slipData.employeeId,
      slipData.month,
      slipData.year,
      slipData.basicSalary,
      slipData.totalAllowances,
      slipData.totalBonus,
      slipData.totalDeductions,
      slipData.netSalary,
      slipData.generatedBy || null,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRowToSalarySlip(result.rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM salary_slips WHERE id = $1 RETURNING id;';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Gets unique month/year combinations for monthly reports.
   * @param {number | undefined} year - Optional year filter
   * @returns {Promise<Array<{ month: number; year: number; generatedAt: Date }>>}
   */
  async getMonthlyReportHistory(year?: number): Promise<Array<{ month: number; year: number; generatedAt: Date }>> {
    const query = `
      SELECT DISTINCT month, year, MAX(generated_at) as generated_at
      FROM salary_slips
      ${year ? 'WHERE year = $1' : ''}
      GROUP BY month, year
      ORDER BY year DESC, month DESC
      LIMIT 50
    `;
    
    const result = year 
      ? await this.pool.query(query, [year])
      : await this.pool.query(query);
    
    return result.rows.map((row: any) => ({
      month: row.month,
      year: row.year,
      generatedAt: new Date(row.generated_at),
    }));
  }

  /**
   * Gets unique years for annual reports.
   * @param {number | undefined} year - Optional year filter
   * @returns {Promise<Array<{ year: number; generatedAt: Date }>>}
   */
  async getAnnualReportHistory(year?: number): Promise<Array<{ year: number; generatedAt: Date }>> {
    const query = `
      SELECT DISTINCT year, MAX(generated_at) as generated_at
      FROM salary_slips
      ${year ? 'WHERE year = $1' : ''}
      GROUP BY year
      ORDER BY year DESC
      LIMIT 20
    `;
    
    const result = year
      ? await this.pool.query(query, [year])
      : await this.pool.query(query);
    
    return result.rows.map((row: any) => ({
      year: row.year,
      generatedAt: new Date(row.generated_at),
    }));
  }
}

