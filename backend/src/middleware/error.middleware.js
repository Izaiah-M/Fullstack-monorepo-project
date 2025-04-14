import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {

    let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

    // Log error instead of console.log
  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
    stack: err.stack,
    payload: req.body,
  });
  
    if (err.status) {
      res.status(err.status).json({
        name: err.name,
        message: err.message,
      });
    } else if (err instanceof ZodError) {
      res.status(400).json({
        name: "Validation Error",
        message: `${err.issues[0].message} '${err.issues[0].path.join(".")}'`,
      });
    } else {
      res.status(500).json({
        name: "Internal Server Error",
      });
    }
  }
  