import { z } from "zod";

export const ProjectIdQuerySchema = z.object({
  projectId: z.string(),
});

export const FileIdParamSchema = z.object({
  id: z.string(),
});
