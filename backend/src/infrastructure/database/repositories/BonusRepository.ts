/**
 * PostgreSQL implementation of IBonusRepository.
 * This class handles database operations for Bonus entities using a PostgreSQL pool.
 * @class BonusRepository
 * @implements {IBonusRepository}
 */
import { Pool } from 'pg';
import { IBonusRepository } from '../../../domain/interfaces/IBonusRepository';
import { Bonus } from '../../../domain/entities/Bonus';
import { pool } from '../postgres/connection';

export class BonusRepository implements IBonusRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Maps database row (snake_case) to Bonus entity (camelCase).
   * @private
   * @param {any} row - Database row object
   * @returns {Bonus} Mapped Bonus entity
   */
  private mapRowToBonus(row: any): Bonus {
    return {
      id: row.id,
      employeeId: row.employee_id,
      type: row.type,
      amount: parseFloat(row.amount),
      awardedDate: new Date(row.awarded_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findByEmployeeId(employeeId: number): Promise<Bonus[]> {
    const query = 'SELECT * FROM bonuses WHERE employee_id = $1 ORDER BY id ASC';
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(this.mapRowToBonus);
  }

  async findById(id: number): Promise<Bonus | null> {
    const query = 'SELECT * FROM bonuses WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToBonus(result.rows[0]) : null;
  }

  async create(bonusData: Omit<Bonus, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bonus> {
    const query = `
      INSERT INTO bonuses (employee_id, type, amount, awarded_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [
      bonusData.employeeId,
      bonusData.type,
      bonusData.amount,
      bonusData.awardedDate || new Date(), // Default to current date if not provided
    ];
    const result = await this.pool.query(query, values);
    return this.mapRowToBonus(result.rows[0]);
  }

  async update(id: number, bonusData: Partial<Omit<Bonus, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>>): Promise<Bonus | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (bonusData.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      values.push(bonusData.type);
      paramIndex++;
    }

    if (bonusData.amount !== undefined) {
      fields.push(`amount = $${paramIndex}`);
      values.push(bonusData.amount);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id); // No fields to update
    }

    values.push(id); // Add id for WHERE clause
    const query = `
      UPDATE bonuses
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *;
    `;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapRowToBonus(result.rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM bonuses WHERE id = $1 RETURNING id;';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

