import { GetUserParamsSchema } from "./user.schema.js";
import { getUserById } from "./user.service.js";

export function UserController({ db, session }) {
  return {
    getUser: async (req, res) => {
      const params = GetUserParamsSchema.parse(req.params);
      const user = await getUserById(db, session, req, params);
      res.status(200).json(user);
    },
  };
}
