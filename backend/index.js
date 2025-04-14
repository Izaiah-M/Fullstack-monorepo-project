import { MongoClient } from "mongodb";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import Session from "./src/utils/session.js";
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
  console.log("Connected to database");

  const db = client.db("filestage");

  // Create indexes for search functionality
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

  const session = await Session({ db });

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
    console.log("a user connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("user disconnected:", socket.id);
    });
  });

  // Attach io to app so you can access it in routes
  app.set("io", io);

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.use("/auth", AuthRoutes({ db, session }));
  app.use("/users", UserRoutes({ db, session }));
  app.use("/projects", ProjectRoutes({ db, session }));
  app.use("/files", FileRoutes({ db, session }));
  app.use("/comments", CommentRoutes({ db, session }));
  app.use("/search", SearchRoutes({ db, session }));

  app.use(errorHandler);

  // ✅ Only use server.listen (with Socket.IO attached)
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  process.on("SIGINT", async () => {
    await client.close();
    process.exit();
  });
}

main();
