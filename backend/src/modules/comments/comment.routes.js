import { Router } from "express";
import { CommentController } from "./comment.controller.js";

export default function CommentRoutes({ db, session }) {
  const router = Router();
  const controller = CommentController({ db, session });

  router.get("/", controller.getAll);
  router.post("/", controller.create);

  return router;
}
