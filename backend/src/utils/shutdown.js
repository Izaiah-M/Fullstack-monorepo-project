import { closeDB } from "../config/db.js";
import { logger } from "./logger.js";

/**
 * Sets up graceful shutdown for the server
 * @param {Object} server - HTTP server instance
 * @param {Object} redis - Redis client
 */
export function setupGracefulShutdown(server, redis) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal || 'shutdown'} signal. Shutting down gracefully`);
    
    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      logger.error("Forced shutdown due to timeout");
      process.exit(1);
    }, 30000);
    
    // First stop accepting new connections
    server.close(() => {
      logger.info("HTTP server closed");
    });
    
    try {
      await closeDB();
      logger.info("Database connection closed");
      
      if (redis) {
        await redis.quit();
        logger.info("Redis connection closed");
      }
      
      clearTimeout(forceExitTimeout);
      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      logger.error("Error during shutdown", { error: error.message });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  
  // Unhandled promise rejections - log but don't exit in when in prod
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Promise Rejection", { 
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    });
    
    // In prod, we might want to continue despite unhandled rejections
    // In dev, we might want to crash to highlight the issue
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(() => process.exit(1), 1000);
    }
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Attempt graceful shutdown
    shutdown("UNCAUGHT_EXCEPTION");
  });
}