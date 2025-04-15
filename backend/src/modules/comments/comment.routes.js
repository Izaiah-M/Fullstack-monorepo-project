import { Router } from "express";
import { CommentController } from "./comment.controller.js";

export default function CommentRoutes({ session }) {
  const router = Router();
  const controller = CommentController({ session });

  router.get("/", controller.getAll);
  router.post("/", controller.create);

  return router;
}