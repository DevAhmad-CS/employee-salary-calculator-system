/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens and extracts user information from requests.
 * It protects routes that require authentication by validating the token and
 * attaching user data to the request object.
 * 
 * @module infrastructure/http/express/middleware/auth.middleware
 * 
 * @remarks
 * This is part of the Infrastructure Layer in Clean Architecture.
 * It handles HTTP-specific authentication concerns (JWT verification).
 * 
 * @example
 * ```typescript
 * import { authenticate } from './middleware/auth.middleware';
 * 
 * // Protect a route:
 * router.get('/protected', authenticate, controller.method);
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Express Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

/**
 * Authentication middleware
 * 
 * Verifies JWT token from Authorization header and attaches user data to request.
 * If token is invalid or missing, returns 401 Unauthorized.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void} Calls next() if authenticated, sends error response otherwise
 * 
 * @example
 * ```typescript
 * // Usage in routes:
 * router.get('/employees', authenticate, employeeController.getAll);
 * ```
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header is required',
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        error: 'JWT_SECRET is not configured',
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret) as {
      id: number;
      username: string;
      role: string;
    };

    // Attach user data to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    // Continue to next middleware/route handler
    next();
  } catch (error: any) {
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
      return;
    }

    // Other errors
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

