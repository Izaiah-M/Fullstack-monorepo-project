import { Router } from "express";
import { SearchController } from "./search.controller.js";

export default function SearchRoutes({ db, session }) {
  const router = Router();
  const controller = SearchController({ db, session });

  router.get("/", controller.search);

  return router;
}