import { GetCommentsQuerySchema, CreateCommentBodySchema } from "./comment.schema.js";
import { getComments, createComment } from "./comment.service.js";

export function CommentController({ session }) {
  return {
    getAll: async (req, res) => {
      const query = GetCommentsQuerySchema.parse(req.query);
      const comments = await getComments(session, req, query);
      res.json(comments);
    },

    create: async (req, res) => {
      const body = CreateCommentBodySchema.parse(req.body);
      const comment = await createComment(session, req, body);
      res.status(201).json(comment);
    },
  };
}