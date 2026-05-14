/**
 * Application Entry Point
 * 
 * This is the main entry point for the backend application.
 * It imports and starts the Express HTTP server.
 * 
 * @module index
 * 
 * @remarks
 * In production, this file can be used as an alternative entry point.
 * The server can also be started directly via: npm run dev
 * 
 * @example
 * ```bash
 * # Development mode
 * npm run dev
 * 
 * # Production mode (after build)
 * npm run build
 * npm start
 * ```
 */

import './infrastructure/http/express/server';

