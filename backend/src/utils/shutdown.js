import { closeDB } from "../config/db.js";
import { logger } from "./logger.js";

/**
 * Sets up graceful shutdown for the server
 * @param {Object} server - HTTP server instance
 * @param {Object} redis - Redis client
 */
export function setupGracefulShutdown(server, redis) {
  const shutdown = async () => {
    logger.info("Shutting down server gracefully");
    
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
      
      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error: error.message });
      process.exit(1);
    }
  };

  // Setup signal handlers
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", { 
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Give logger time to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}