import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";

export async function getUserById(db, session, req, params) {
  const { userId } = await session.get(req);
  if (!userId) {
    throw new UnauthorizedError();
  }

  const { userId: targetUserId } = params;

  const user = await db
    .collection("users")
    .findOne({ _id: targetUserId }, { password: 0 });

  if (!user) {
    throw new NotFoundError();
  }

  return user;
}
