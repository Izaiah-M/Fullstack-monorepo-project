import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

/**
 * Global error handling middleware
 * 
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorMiddleware(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
    error: err.name,
    stack: err.stack,
    payload: req.body
  });
  
  // Handle ZodError (validation errors)
  if (err instanceof ZodError) {
    return res.status(400).json({
      name: "Validation Error",
      message: `${err.issues[0].message} '${err.issues[0].path.join(".")}'`
    });
  }
  
  // Handle custom errors with status codes
  if (err.status) {
    return res.status(err.status).json({
      name: err.name,
      message: err.message
    });
  }
  
  // Handle unexpected errors
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    name: isProd ? "Internal Server Error" : err.name || "Error", 
    message: isProd ? "Something went wrong" : message
  });
}