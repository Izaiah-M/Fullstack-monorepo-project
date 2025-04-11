import { UnauthorizedError } from "../../utils/errors.js";

export async function getComments(db, session, req, query) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { fileId } = query;

  return db
    .collection("comments")
    .find({ fileId }, { sort: { createdAt: 1 }, limit: 100 })
    .toArray();
}

export async function createComment(db, session, req, body) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { fileId, body: commentBody, x, y } = body;

  const { insertedId } = await db.collection("comments").insertOne({
    fileId,
    authorId: userId,
    body: commentBody,
    x,
    y,
    createdAt: new Date(),
  });

  return db.collection("comments").findOne({ _id: insertedId });
}
