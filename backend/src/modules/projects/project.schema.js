import { z } from "zod";
import { StringObjectId } from "../../schemas.js";

export const CreateProjectSchema = z.object({
  name: z.string(),
});

export const AddReviewerSchema = z.object({
  email: z.string().email(),
});

export const ProjectIdParamsSchema = z.object({
  projectId: StringObjectId,
});
