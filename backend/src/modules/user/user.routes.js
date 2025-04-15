import { Router } from "express";
import { UserController } from "./user.controller.js";

export default function UserRoutes({ session }) {
  const router = Router();
  const controller = UserController({ session });

  router.get("/:userId", controller.getUser);

  return router;
}