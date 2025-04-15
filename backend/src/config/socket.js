// src/socket/index.js
import { Server } from "socket.io";
import { logger } from "../utils/logger.js";

/**
 * Sets up Socket.io for the server
 * @param {Object} server - HTTP server instance
 * @param {Object} options - Configuration options
 * @returns {Object} - Socket.io instance
 */
export function setupSocket(server, options = {}) {
  const io = new Server(server, {
    cors: {
      origin: options.corsOrigin || process.env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.io connection handler
  io.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id });
    });
  });

  return io;
}

/**
 * Emits a comment event to all clients
 * @param {Object} io - Socket.io instance
 * @param {String} fileId - ID of the file
 * @param {Object} data - Data to emit
 * @param {String} senderSocketId - Socket ID of the sender
 */
export function emitComment(io, fileId, data, senderSocketId = null) {
  io.emit(`comments:${fileId}`, { 
    ...data,
    senderSocketId 
  });
  
  logger.debug("Emitted comment", { 
    fileId, 
    commentId: data.comment?._id,
    senderSocketId 
  });
}