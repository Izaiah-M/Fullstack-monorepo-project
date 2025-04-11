import { z } from "zod";
import { StringObjectId } from "../../utils/schemas.js";

export const GetCommentsQuerySchema = z.object({
  fileId: StringObjectId,
});

export const CreateCommentBodySchema = z.object({
  fileId: StringObjectId,
  body: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
