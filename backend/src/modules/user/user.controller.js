import { GetUserParamsSchema } from "./user.schema.js";
import { getUserById } from "./user.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * User controller factory function
 * 
 * @param {Object} params - Controller parameters
 * @param {Object} params.session - Session service
 * @returns {Object} User controller methods
 */
export function UserController({ session }) {
  return {
    getUser: asyncHandler(async (req, res) => {
      const params = GetUserParamsSchema.parse(req.params);
      const user = await getUserById(session, req, params);
      res.status(200).json(user);
    }),
  };
}