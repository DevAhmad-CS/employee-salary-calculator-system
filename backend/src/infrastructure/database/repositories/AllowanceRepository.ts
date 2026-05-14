/**
 * PostgreSQL implementation of IAllowanceRepository.
 * This class handles database operations for Allowance entities using a PostgreSQL pool.
 * @class AllowanceRepository
 * @implements {IAllowanceRepository}
 */
import { Pool } from 'pg';
import { IAllowanceRepository } from '../../../domain/interfaces/IAllowanceRepository';
import { Allowance } from '../../../domain/entities/Allowance';
import { pool } from '../postgres/connection';

export class AllowanceRepository implements IAllowanceRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Maps database row (snake_case) to Allowance entity (camelCase).
   * @private
   * @param {any} row - Database row object
   * @returns {Allowance} Mapped Allowance entity
   */
  private mapRowToAllowance(row: any): Allowance {
    return {
      id: row.id,
      employeeId: row.employee_id,
      type: row.type,
      amount: parseFloat(row.amount),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findByEmployeeId(employeeId: number): Promise<Allowance[]> {
    const query = 'SELECT * FROM allowances WHERE employee_id = $1 ORDER BY id ASC';
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(this.mapRowToAllowance);
  }

  async findById(id: number): Promise<Allowance | null> {
    const query = 'SELECT * FROM allowances WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToAllowance(result.rows[0]) : null;
  }

  async create(allowanceData: Omit<Allowance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Allowance> {
    const query = `
      INSERT INTO allowances (employee_id, type, amount)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [
      allowanceData.employeeId,
      allowanceData.type,
      allowanceData.amount,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRowToAllowance(result.rows[0]);
  }

  async update(id: number, allowanceData: Partial<Omit<Allowance, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>): Promise<Allowance | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (allowanceData.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      values.push(allowanceData.type);
      paramIndex++;
    }

    if (allowanceData.amount !== undefined) {
      fields.push(`amount = $${paramIndex}`);
      values.push(allowanceData.amount);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id); // No fields to update
    }

    values.push(id); // Add id for WHERE clause
    const query = `
      UPDATE allowances
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *;
    `;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapRowToAllowance(result.rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM allowances WHERE id = $1 RETURNING id;';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

