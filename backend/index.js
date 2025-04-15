import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import SessionService from "./src/utils/session.js";
import Redis from "./src/config/redis.js";
import AuthRoutes from "./src/modules/auth/auth.routes.js";
import UserRoutes from "./src/modules/user/user.routes.js";
import ProjectRoutes from "./src/modules/projects/project.routes.js";
import FileRoutes from "./src/modules/files/file.routes.js";
import CommentRoutes from "./src/modules/comments/comment.routes.js";
import SearchRoutes from "./src/modules/search/search.routes.js";
import { Server } from "socket.io";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import { connectDB, closeDB } from "./src/config/db.js";
import { logger } from "./src/utils/logger.js";

async function main() {
  try {
    await connectDB();
    const redis = await Redis();
    const session = await SessionService();


    const app = express();
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      logger.info("Socket connected", { socketId: socket.id });
      socket.on("disconnect", () => {
        logger.info("Socket disconnected", { socketId: socket.id });
      });
    });

    app.set("io", io);
    app.use(express.json());
    app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
    app.use(cookieParser(process.env.COOKIE_SECRET));

    app.use((req, res, next) => {
       logger.info(`${req.method} ${req.url}`);
      next();
    });


    app.use("/auth", AuthRoutes({ session }));
    app.use("/users", UserRoutes({ session }));
    app.use("/projects", ProjectRoutes({ session }));
    app.use("/files", FileRoutes({ session }));
    app.use("/comments", CommentRoutes({ session }));
    app.use("/search", SearchRoutes({ session, redis }));
    app.use(errorMiddleware);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
    });

    process.on("SIGINT", async () => {
      logger.info("Shutting down server gracefully");
      await closeDB();
      await redis.quit();
      process.exit(0);
    });

    // Handling unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", { promise, reason });
      // Won't exit the process as it would be too abrupt
    });

    // Handle anyy uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", { error: error.message, stack: error.stack });
      // Give the logger some time to flush
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  } catch (error) {
    logger.error("Failed to start server", { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();