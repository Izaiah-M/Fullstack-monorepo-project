import { Server } from "socket.io";
import { logger } from "../utils/logger.js";

/**
 * Sets up Socket.io for the server
 * @param {Object} server - HTTP server instance
 * @param {Object} options - Configuration options
 * @returns {Object} - Socket.io instance
 */
export function setupSocket(server, options = {}) {
  try {
    const io = new Server(server, {
      cors: {
        origin: options.corsOrigin || process.env.FRONTEND_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Error handler for Socket.io server
    io.engine.on("connection_error", (err) => {
      logger.error("Socket.io connection error", {
        error: err.message,
        req: err.req.url,
        code: err.code
      });
    });

    // Socket.io connection handler
    io.on("connection", (socket) => {
      logger.info("Socket connected", { socketId: socket.id });
      
      // Handle socket errors these happend after connenction
      socket.on("error", (error) => {
        logger.error("Socket error", { 
          socketId: socket.id,
          error: error.message 
        });
      });
      
      // Handle disconnect
      socket.on("disconnect", (reason) => {
        logger.info("Socket disconnected", { 
          socketId: socket.id,
          reason 
        });
      });
      
      // Handle custom events with error handling
      socket.onAny((event, ...args) => {
        try {
          logger.debug("Socket event received", { 
            socketId: socket.id,
            event,
            args: JSON.stringify(args).substring(0, 200) // we're to truncate long arguments
          });
        } catch (error) {
          logger.error("Error processing socket event", {
            socketId: socket.id,
            event,
            error: error.message
          });
        }
      });
    });

    return io;
  } catch (error) {
    logger.error("Failed to setup Socket.io", {
      error: error.message,
      stack: error.stack
    });
    
    return {
      emit: () => {},
      on: () => {},
      of: () => ({
        emit: () => {},
        on: () => {}
      })
    };
  }
}

/**
 * Emits a comment event to all clients
 * @param {Object} io - Socket.io instance
 * @param {String} fileId - ID of the file
 * @param {Object} data - Data to emit
 * @param {String} senderSocketId - Socket ID of the sender
 */
export function emitComment(io, fileId, data, senderSocketId = null) {
  try {
    if (!io) {
      logger.warn("Socket.io instance not available, skipping emit");
      return;
    }
    
    io.emit(`comments:${fileId}`, { 
      ...data,
      senderSocketId 
    });
    
    logger.debug("Emitted comment", { 
      fileId, 
      commentId: data.comment?._id,
      senderSocketId 
    });
  } catch (error) {
    logger.error("Failed to emit comment", {
      error: error.message,
      fileId,
      commentId: data.comment?._id
    });
  }
}