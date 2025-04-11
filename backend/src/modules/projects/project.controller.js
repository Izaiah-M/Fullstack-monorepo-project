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
  
  export function ProjectController({ db, session }) {
    return {
      create: async (req, res) => {
        const body = CreateProjectSchema.parse(req.body);
        const project = await createProject(db, session, req, body);
        res.status(201).json(project);
      },
  
      getAll: async (req, res) => {
        const projects = await getProjects(db, session, req);
        res.status(201).json(projects);
      },
  
      addReviewer: async (req, res) => {
        const params = ProjectIdParamsSchema.parse(req.params);
        const body = AddReviewerSchema.parse(req.body);
        const project = await addReviewer(db, session, req, params, body);
        res.status(201).json(project);
      },
    };
  }
  