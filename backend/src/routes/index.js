import AuthRoutes from "../modules/auth/auth.routes.js";
import UserRoutes from "../modules/user/user.routes.js";
import ProjectRoutes from "../modules/projects/project.routes.js";
import FileRoutes from "../modules/files/file.routes.js";
import CommentRoutes from "../modules/comments/comment.routes.js";
import SearchRoutes from "../modules/search/search.routes.js";

/**
 * Sets up all application routes
 * @param {Object} app - Express app instance
 * @param {Object} services - Services to inject into routes
 */
export function setupRoutes(app, services) {
  app.use("/auth", AuthRoutes(services));
  app.use("/users", UserRoutes(services));
  app.use("/projects", ProjectRoutes(services));
  app.use("/files", FileRoutes(services));
  app.use("/comments", CommentRoutes(services));
  app.use("/search", SearchRoutes(services));
}