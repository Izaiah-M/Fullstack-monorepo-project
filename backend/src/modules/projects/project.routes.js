import { Router } from "express";
import { ProjectController } from "./project.controller.js";

export default function ProjectRoutes({ db, session }) {
  const router = Router();
  const controller = ProjectController({ db, session });

  router.post("/", controller.create);
  router.get("/", controller.getAll);
  router.post("/:projectId/reviewers", controller.addReviewer);

  return router;
}
