/**
 * Express Application Configuration
 * 
 * This module configures and exports the Express application instance.
 * It sets up middleware for security, CORS, logging, and request parsing.
 * 
 * @module infrastructure/http/express/app
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * It handles HTTP-specific concerns like middleware, routing, and request/response handling.
 * 
 * @example
 * ```typescript
 * import app from './infrastructure/http/express/app';
 * 
 * // Start server
 * app.listen(3001, () => {
 *   console.log('Server running on port 3001');
 * });
 * ```
 */

import express, { Application, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employees.routes';
import allowanceRoutes from './routes/allowances.routes';
import deductionRoutes from './routes/deductions.routes';
import bonusRoutes from './routes/bonuses.routes';
import salarySlipRoutes from './routes/salary-slips.routes';
import reportRoutes from './routes/reports.routes';
import profileRoutes from './routes/profile.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Load environment variables
dotenv.config();

/**
 * Express application instance
 * 
 * This is the main Express app that will handle all HTTP requests.
 * Middleware and routes are configured here.
 * 
 * @constant {Application}
 */
const app: Application = express();

// ============================================
// Security Middleware
// ============================================

/**
 * Helmet middleware
 * 
 * Sets various HTTP headers to help protect the app from well-known
 * web vulnerabilities by setting HTTP headers appropriately.
 * 
 * @see https://helmetjs.github.io/
 */
app.use(helmet());

/**
 * CORS (Cross-Origin Resource Sharing) configuration
 * 
 * Allows the frontend application (running on a different port/domain)
 * to make requests to this API. The origin is configured via environment variable.
 * 
 * @property {string} origin - Allowed origin (default: http://localhost:5173)
 * @property {boolean} credentials - Allow cookies/credentials in cross-origin requests
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all localhost ports for development (5173, 5174, 5175, etc.)
      if (origin.match(/^http:\/\/localhost:\d+$/) || 
          origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
        return callback(null, true);
      }
      
      // Allow specific origin from environment variable
      const allowedOrigin = process.env.CORS_ORIGIN;
      if (allowedOrigin && origin === allowedOrigin) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ============================================
// Logging Middleware
// ============================================

/**
 * Morgan HTTP request logger
 * 
 * Logs HTTP requests in development mode with details like method, URL, status, and response time.
 * Useful for debugging and monitoring API usage.
 * 
 * @see https://github.com/expressjs/morgan
 */
app.use(morgan('dev'));

// ============================================
// Body Parsing Middleware
// ============================================

/**
 * JSON body parser
 * 
 * Parses incoming requests with JSON payloads.
 * Makes req.body available as a JavaScript object.
 */
app.use(express.json());

/**
 * URL-encoded body parser
 * 
 * Parses incoming requests with URL-encoded payloads.
 * The extended option allows parsing of rich objects and arrays.
 */
app.use(express.urlencoded({ extended: true }));

// ============================================
// Health Check Endpoint
// ============================================

/**
 * Health check endpoint
 * 
 * Simple endpoint to verify that the server is running and responsive.
 * Useful for monitoring, load balancers, and deployment checks.
 * 
 * @route GET /health
 * @returns {Object} Server status information
 * 
 * @example
 * GET /health
 * Response: { status: 'OK', message: 'Server is running' }
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ============================================
// Root Route
// ============================================

/**
 * Root endpoint
 * 
 * Provides basic API information and redirects to health check.
 * 
 * @route GET /
 * @returns {Object} API information
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Employee Salary System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
    },
  });
});

// ============================================
// API Routes
// ============================================

/**
 * Authentication routes
 * 
 * Mounts all authentication-related endpoints under /api/auth prefix.
 * Available endpoints:
 * - POST /api/auth/login - User login and JWT token generation
 * 
 * @route /api/auth
 */
app.use('/api/auth', authRoutes);

/**
 * Employee routes
 * 
 * Mounts all employee-related endpoints under /api/employees prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - GET /api/employees - Get all employees (with pagination, search, filter)
 * - GET /api/employees/:id - Get employee by ID
 * - POST /api/employees - Create new employee
 * - PUT /api/employees/:id - Update employee
 * - DELETE /api/employees/:id - Delete employee
 * 
 * @route /api/employees
 */
app.use('/api/employees', employeeRoutes);

/**
 * Allowance routes
 * 
 * Mounts all allowance-related endpoints under /api/allowances prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - GET /api/allowances/employee/:employeeId - Get all allowances for an employee
 * - GET /api/allowances/:id - Get allowance by ID
 * - POST /api/allowances - Create new allowance
 * - PUT /api/allowances/:id - Update allowance
 * - DELETE /api/allowances/:id - Delete allowance
 * 
 * @route /api/allowances
 */
app.use('/api/allowances', allowanceRoutes);

/**
 * Deduction routes
 * 
 * Mounts all deduction-related endpoints under /api/deductions prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - GET /api/deductions/employee/:employeeId - Get all deductions for an employee
 * - GET /api/deductions/:id - Get deduction by ID
 * - POST /api/deductions - Create new deduction
 * - PUT /api/deductions/:id - Update deduction
 * - DELETE /api/deductions/:id - Delete deduction
 * 
 * @route /api/deductions
 */
app.use('/api/deductions', deductionRoutes);

/**
 * Bonus routes
 * 
 * Mounts all bonus-related endpoints under /api/bonuses prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - GET /api/bonuses/employee/:employeeId - Get all bonuses for an employee
 * - GET /api/bonuses/:id - Get bonus by ID
 * - POST /api/bonuses - Create new bonus
 * - PUT /api/bonuses/:id - Update bonus
 * - DELETE /api/bonuses/:id - Delete bonus
 * 
 * @route /api/bonuses
 */
app.use('/api/bonuses', bonusRoutes);

/**
 * Salary Slip routes
 * 
 * Mounts all salary slip-related endpoints under /api/salary-slips prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - POST /api/salary-slips/generate - Generate a new salary slip
 * - GET /api/salary-slips/:id - Get salary slip by ID
 * - GET /api/salary-slips/employee/:employeeId - Get all salary slips for an employee
 * - GET /api/salary-slips?month=X&year=Y - Get all salary slips for a specific month and year
 * 
 * @route /api/salary-slips
 */
app.use('/api/salary-slips', salarySlipRoutes);

/**
 * Report routes
 * 
 * Mounts all report-related endpoints under /api/reports prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - POST /api/reports/generate - Generate monthly or annual report
 * 
 * @route /api/reports
 */
app.use('/api/reports', reportRoutes);

/**
 * Profile routes
 * 
 * Mounts all profile-related endpoints under /api/profile prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - GET /api/profile - Get current user's profile
 * - PUT /api/profile - Update current user's profile
 * - POST /api/profile/change-password - Change current user's password
 * 
 * @route /api/profile
 */
app.use('/api/profile', profileRoutes);

/**
 * Dashboard routes
 * 
 * Mounts all dashboard-related endpoints under /api/dashboard prefix.
 * All routes are protected by authentication middleware.
 * Available endpoints:
 * - GET /api/dashboard/statistics - Get dashboard statistics (total employees, monthly salary, average salary, departments)
 * 
 * @route /api/dashboard
 */
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// Error Handling Middleware
// ============================================

/**
 * Global error handler middleware
 * 
 * Catches any unhandled errors from route handlers and sends
 * a proper JSON error response to the client.
 * 
 * This should be the last middleware in the chain.
 */
app.use((err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request path:', req.path);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

/**
 * 404 handler
 * 
 * Catches any requests that don't match any route
 * and returns a 404 JSON response.
 */
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

/**
 * Default export of the Express application
 * 
 * This app instance can be imported and used to start the server
 * or for testing purposes.
 */
export default app;

