import { z } from "zod";
import { StringObjectId } from "../../utils/schemas.js";

export const GetCommentsQuerySchema = z.object({
  fileId: StringObjectId,
});

// TODO: update this schema to support both new comments and replies
export const CreateCommentBodySchema = z.object({
  fileId: StringObjectId,
  body: z.string(),
  // Make coordinates optional
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  // Add parentId as an optional field for replies
  parentId: StringObjectId.optional(),
}).refine((data) => {
  // If parentId exists (it's a reply), here coordinates are not required
  if (data.parentId) {
    return true;
  }
  // If it's a top-level comment, coordinates are required
  return data.x !== undefined && data.y !== undefined;
}, {
  message: "Coordinates (x, y) are required for top-level comments"
});