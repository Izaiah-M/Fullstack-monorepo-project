import { Router } from "express";
import { UserController } from "./user.controller.js";

export default function UserRoutes({ db, session }) {
  const router = Router();
  const controller = UserController({ db, session });

  router.get("/:userId", controller.getUser);

  return router;
}
