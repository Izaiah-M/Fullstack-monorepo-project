import { Router } from "express";
import { FileController } from "./file.controller.js";
import { upload } from "./file.service.js";

export default function FileRoutes({ db, session }) {
  const router = Router();
  const controller = FileController({ db, session });

  router.post("/", upload.single("file"), controller.upload);
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.get("/:id/content", controller.getContent);

  return router;
}
