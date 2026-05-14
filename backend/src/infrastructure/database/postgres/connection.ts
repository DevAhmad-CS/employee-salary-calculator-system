/**
 * PostgreSQL Database Connection Pool
 * 
 * This module establishes and manages the connection pool to the PostgreSQL database.
 * It uses environment variables for configuration and provides a singleton pool instance
 * that can be imported and used throughout the application.
 * 
 * @module infrastructure/database/postgres/connection
 * @requires pg - PostgreSQL client library
 * @requires dotenv - Environment variable loader
 * 
 * @example
 * ```typescript
 * import { pool } from './infrastructure/database/postgres/connection';
 * 
 * const result = await pool.query('SELECT * FROM employees');
 * ```
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Database connection configuration
 *
 * If `DATABASE_URL` is set (e.g. Neon), it is used as `connectionString` with SSL enabled.
 * Otherwise uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for local Postgres.
 *
 * @constant {PoolConfig}
 */
const databaseUrl = process.env.DATABASE_URL?.trim();

const config: PoolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'employee_salary_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

/**
 * PostgreSQL connection pool instance
 * 
 * This is a singleton pool that manages database connections efficiently.
 * The pool automatically handles connection lifecycle, reconnection, and error recovery.
 * 
 * @constant {Pool}
 * @exports pool
 * 
 * @example
 * ```typescript
 * // Execute a query
 * const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
 * 
 * // Use transactions
 * const client = await pool.connect();
 * try {
 *   await client.query('BEGIN');
 *   // ... your queries
 *   await client.query('COMMIT');
 * } catch (err) {
 *   await client.query('ROLLBACK');
 *   throw err;
 * } finally {
 *   client.release();
 * }
 * ```
 */
export const pool = new Pool(config);

/**
 * Connection event handler - fires when a new client connects to the database
 * 
 * This event is useful for logging successful connections and monitoring
 * database connectivity during application startup.
 */
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

/**
 * Error event handler - fires when a connection error occurs
 * 
 * This handler logs the error and exits the process to prevent the application
 * from running in an invalid state. In production, you might want to implement
 * more sophisticated error recovery strategies.
 * 
 * @param {Error} err - The connection error object
 */
pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  // Exit process to prevent application from running without database
  process.exit(-1);
});

export default pool;