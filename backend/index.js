import { MongoClient } from "mongodb";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import Session from "./src/utils/session.js";
import Redis from "./src/utils/redis.js";
import AuthRoutes from "./src/modules/auth/auth.routes.js";
import UserRoutes from "./src/modules/user/user.routes.js";
import ProjectRoutes from "./src/modules/projects/project.routes.js";
import FileRoutes from "./src/modules/files/file.routes.js";
import CommentRoutes from "./src/modules/comments/comment.routes.js";
import SearchRoutes from "./src/modules/search/search.routes.js";
import { errorHandler } from "./src/utils/errors.js";
import { Server } from "socket.io";

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const redis = await Redis();
  console.log("Connected to Redis");

  const db = client.db("filestage");
  const session = await Session({ db });

  // Create indexes for search
  await Promise.all([
    // Project indexes
    db.collection("projects").createIndex({ name: 1 }),
    db.collection("projects").createIndex({ description: 1 }),
    db.collection("projects").createIndex({ authorId: 1 }),
    db.collection("projects").createIndex({ reviewers: 1 }),
    db.collection("projects").createIndex({ createdAt: -1 }),
    
    // File indexes
    db.collection("files").createIndex({ name: 1 }),
    db.collection("files").createIndex({ projectId: 1 }),
    db.collection("files").createIndex({ authorId: 1 }),
    db.collection("files").createIndex({ createdAt: -1 }),
    
    // Comment indexes
    db.collection("comments").createIndex({ body: 1 }),
    db.collection("comments").createIndex({ fileId: 1 }),
    db.collection("comments").createIndex({ authorId: 1 }),
    db.collection("comments").createIndex({ parentId: 1 }),
    db.collection("comments").createIndex({ createdAt: -1 })
  ]);

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
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  app.set("io", io);
  app.use(express.json());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.use("/auth", AuthRoutes({ db, session }));
  app.use("/users", UserRoutes({ db, session }));
  app.use("/projects", ProjectRoutes({ db, session }));
  app.use("/files", FileRoutes({ db, session }));
  app.use("/comments", CommentRoutes({ db, session }));
  app.use("/search", SearchRoutes({ db, session, redis }));

  app.use(errorHandler);

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  process.on("SIGINT", async () => {
    await client.close();
    await redis.quit();
    process.exit();
  });
}

main().catch(console.error);