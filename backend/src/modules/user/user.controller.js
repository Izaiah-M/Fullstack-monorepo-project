import { GetUserParamsSchema } from "./user.schema.js";
import { getUserById } from "./user.service.js";

export function UserController({ session }) {
  return {
    getUser: async (req, res) => {
      const params = GetUserParamsSchema.parse(req.params);
      const user = await getUserById(session, req, params);
      res.status(200).json(user);
    },
  };
}