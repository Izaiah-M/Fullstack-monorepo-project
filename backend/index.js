import { MongoClient } from "mongodb";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Session from "./src/utils/session.js";
import AuthRoutes from "./src/modules/auth/auth.routes.js";
import UserRoutes from "./src/modules/user/user.routes.js";
import ProjectRoutes from "./src/modules/projects/project.routes.js";
import FileRoutes from "./src/modules/files/files.routes.js";
import CommentRoutes from "./src/modules/comments/comments.routes.js";
import { errorHandler } from "./src/utils/errors.js";

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log("Connected to database");

  const db = client.db("filestage");

  const session = await Session({ db });

  const app = express();

  app.use(express.json());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.use("/auth", AuthRoutes({ db, session }));
  app.use("/users", UserRoutes({ db, session }));
  app.use("/projects", ProjectRoutes({ db, session }));
  app.use("/files", FileRoutes({ db, session }));
  app.use("/comments", CommentRoutes({ db, session }));

  app.use(errorHandler);

  app.listen(process.env.PORT, () =>
    console.log(`Server running on port: ${process.env.PORT}`),
  );

  process.on("SIGINT", async () => {
    await client.close();
    process.exit();
  });
}

main();
