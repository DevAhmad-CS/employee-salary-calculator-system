/**
 * HTTP Server Entry Point
 * 
 * This module starts the Express HTTP server and listens on the configured port.
 * It imports the Express app configuration and starts the server process.
 * 
 * @module infrastructure/http/express/server
 * 
 * @remarks
 * This file is typically the entry point when running the backend server.
 * The port is read from environment variables with a fallback default.
 * 
 * @example
 * ```bash
 * # Run with ts-node
 * ts-node src/infrastructure/http/express/server.ts
 * 
 * # Or with npm script
 * npm run dev
 * ```
 */

import app from './app';
import dotenv from 'dotenv';
// Import database connection to initialize it and test connection on server start
import { pool } from '../../database/postgres/connection';

// Load environment variables
dotenv.config();

/**
 * Server port number
 * 
 * Reads from environment variable PORT, defaults to 3001 if not set.
 * This allows flexible port configuration for different environments.
 * 
 * @constant {number}
 */
const PORT = process.env.PORT || 3001;

/**
 * Test database connection
 * 
 * Performs a simple query to verify database connectivity.
 * This ensures the database is accessible before starting the server.
 */
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Start the HTTP server
 * 
 * Begins listening for incoming HTTP requests on the specified port.
 * Tests database connection before starting the server.
 * 
 * @event listening - Fired when the server starts listening
 * 
 * @example
 * Server will start and log:
 * "✅ Database connected successfully"
 * "🚀 Server running on http://localhost:3001"
 */
async function startServer() {
  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server will not start.');
    process.exit(1);
  }

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

