import {
  CreateProjectSchema,
  AddReviewerSchema,
  ProjectIdParamsSchema,
} from "./project.schema.js";
import {
  createProject,
  getProjects,
  addReviewer,
} from "./project.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Project controller factory function
 * 
 * @param {Object} params - Controller dependencies
 * @param {Object} params.session - Session service
 * @returns {Object} Controller methods
 */
export function ProjectController({ session }) {
  return {
    create: asyncHandler(async (req, res) => {
      const body = CreateProjectSchema.parse(req.body);
      const project = await createProject(session, req, body);
      res.status(201).json(project);
    }),

    getAll: asyncHandler(async (req, res) => {
      const projects = await getProjects(session, req);
      res.status(200).json(projects);
    }),

    addReviewer: asyncHandler(async (req, res) => {
      const params = ProjectIdParamsSchema.parse(req.params);
      const body = AddReviewerSchema.parse(req.body);
      const project = await addReviewer(session, req, params, body);
      res.status(200).json(project);
    }),
  };
}