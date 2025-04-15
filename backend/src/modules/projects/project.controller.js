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

export function ProjectController({ session }) {
  return {
    create: async (req, res) => {
      const body = CreateProjectSchema.parse(req.body);
      const project = await createProject(session, req, body);
      res.status(201).json(project);
    },

    getAll: async (req, res) => {
      const projects = await getProjects(session, req);
      res.status(201).json(projects);
    },

    addReviewer: async (req, res) => {
      const params = ProjectIdParamsSchema.parse(req.params);
      const body = AddReviewerSchema.parse(req.body);
      const project = await addReviewer(session, req, params, body);
      res.status(201).json(project);
    },
  };
}