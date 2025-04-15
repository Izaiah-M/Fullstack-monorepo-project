import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import SessionService from "./src/utils/session.js";
import Redis from "./src/config/redis.js";
import { setupRoutes } from "./src/routes/index.js";
import { setupSocket } from "./src/config/socket.js";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import { connectDB, closeDB } from "./src/config/db.js";
import { logger } from "./src/utils/logger.js";
import { setupGracefulShutdown } from "./src/utils/shutdown.js";

async function main() {
  try {
    await connectDB();
    const redis = await Redis();
    const session = await SessionService();

    const app = express();
    const server = http.createServer(app);

    app.use(express.json());
    app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
    app.use(cookieParser(process.env.COOKIE_SECRET));
    
    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });

    const io = setupSocket(server, {
      corsOrigin: process.env.FRONTEND_ORIGIN
    });
    
    app.set("io", io);

    setupRoutes(app, { session, redis });
    
    app.use(errorMiddleware);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
    });

    setupGracefulShutdown(server, redis);
    
  } catch (error) {
    logger.error("Failed to start server", { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();