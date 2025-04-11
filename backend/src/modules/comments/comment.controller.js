import { GetCommentsQuerySchema, CreateCommentBodySchema } from "./comment.schema.js";
import { getComments, createComment } from "./comment.service.js";

export function CommentController({ db, session }) {
  return {
    getAll: async (req, res) => {
      const query = GetCommentsQuerySchema.parse(req.query);
      const comments = await getComments(db, session, req, query);
      res.json(comments);
    },

    create: async (req, res) => {
      const body = CreateCommentBodySchema.parse(req.body);
      const comment = await createComment(db, session, req, body);
      res.status(201).json(comment);
    },
  };
}
