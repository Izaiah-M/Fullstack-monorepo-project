import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
import User from "../../models/User.js";

export async function getUserById(session, req, params) {
  const { userId } = await session.get(req);
  if (!userId) {
    throw new UnauthorizedError();
  }

  const { userId: targetUserId } = params;

  const user = await User.findById(targetUserId).select("-password");

  if (!user) {
    throw new NotFoundError();
  }

  return user;
}