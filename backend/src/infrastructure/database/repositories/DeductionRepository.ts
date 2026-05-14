/**
 * PostgreSQL implementation of IDeductionRepository.
 * This class handles database operations for Deduction entities using a PostgreSQL pool.
 * @class DeductionRepository
 * @implements {IDeductionRepository}
 */
import { Pool } from 'pg';
import { IDeductionRepository } from '../../../domain/interfaces/IDeductionRepository';
import { Deduction } from '../../../domain/entities/Deduction';
import { pool } from '../postgres/connection';

export class DeductionRepository implements IDeductionRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Maps database row (snake_case) to Deduction entity (camelCase).
   * @private
   * @param {any} row - Database row object
   * @returns {Deduction} Mapped Deduction entity
   */
  private mapRowToDeduction(row: any): Deduction {
    return {
      id: row.id,
      employeeId: row.employee_id,
      type: row.type,
      amount: parseFloat(row.amount),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findByEmployeeId(employeeId: number): Promise<Deduction[]> {
    const query = 'SELECT * FROM deductions WHERE employee_id = $1 ORDER BY id ASC';
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(this.mapRowToDeduction);
  }

  async findById(id: number): Promise<Deduction | null> {
    const query = 'SELECT * FROM deductions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToDeduction(result.rows[0]) : null;
  }

  async create(deductionData: Omit<Deduction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deduction> {
    const query = `
      INSERT INTO deductions (employee_id, type, amount)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [
      deductionData.employeeId,
      deductionData.type,
      deductionData.amount,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRowToDeduction(result.rows[0]);
  }

  async update(id: number, deductionData: Partial<Omit<Deduction, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>): Promise<Deduction | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (deductionData.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      values.push(deductionData.type);
      paramIndex++;
    }

    if (deductionData.amount !== undefined) {
      fields.push(`amount = $${paramIndex}`);
      values.push(deductionData.amount);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id); // No fields to update
    }

    values.push(id); // Add id for WHERE clause
    const query = `
      UPDATE deductions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *;
    `;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapRowToDeduction(result.rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM deductions WHERE id = $1 RETURNING id;';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

