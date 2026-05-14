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
 * Reads connection parameters from environment variables with fallback defaults.
 * All sensitive values (password, host, etc.) should be set in .env file.
 * 
 * @constant {PoolConfig}
 * @property {string} host - Database server hostname (default: 'localhost')
 * @property {number} port - Database server port (default: 5432)
 * @property {string} database - Database name (default: 'employee_salary_system')
 * @property {string} user - Database username (default: 'postgres')
 * @property {string} password - Database password (must be set in .env)
 * @property {number} max - Maximum number of clients in the pool (default: 20)
 * @property {number} idleTimeoutMillis - Close idle clients after this many milliseconds (default: 30000)
 * @property {number} connectionTimeoutMillis - Return error after this many milliseconds if connection cannot be established (default: 2000)
 */
const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'employee_salary_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum 20 concurrent connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Fail connection attempts after 2 seconds
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