import { Router } from "express";
import { SearchController } from "./search.controller.js";

export default function SearchRoutes({ session, redis }) {
  const router = Router();
  const controller = SearchController({ session, redis });

  router.get("/", controller.search);

  return router;
}