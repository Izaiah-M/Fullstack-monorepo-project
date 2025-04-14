import { Router } from "express";
import { SearchController } from "./search.controller.js";

export default function SearchRoutes({ db, session, redis }) {
  const router = Router();
  const controller = SearchController({ db, session, redis });

  router.get("/", controller.search);

  return router;
}