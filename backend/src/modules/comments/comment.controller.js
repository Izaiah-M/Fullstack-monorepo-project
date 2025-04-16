import { GetCommentsQuerySchema, CreateCommentBodySchema } from "./comment.schema.js";
import { getComments, createComment } from "./comment.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Comment controller factory function
 * 
 * @param {Object} params - Controller dependencies
 * @param {Object} params.session - Session service
 * @returns {Object} Controller methods
 */
export function CommentController({ session }) {
  return {
    getAll: asyncHandler(async (req, res) => {
      const query = GetCommentsQuerySchema.parse(req.query);
      const comments = await getComments(session, req, query);
      res.json(comments);
    }),

    create: asyncHandler(async (req, res) => {
      const body = CreateCommentBodySchema.parse(req.body);
      const comment = await createComment(session, req, body);
      res.status(201).json(comment);
    }),
  };
}