import { UnauthorizedError } from "../../utils/errors.js";
import { ObjectId } from "mongodb";

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

  const { fileId, body: commentBody, x, y, parentId } = body;

  // Create the comment object
  const comment = {
    fileId,
    authorId: userId,
    body: commentBody,
    createdAt: new Date(),
  };

  // Add coordinates only for top-level comments
  if (x !== undefined && y !== undefined) {
    comment.x = x;
    comment.y = y;
  }

  // Add parentId for replies
  if (parentId) {
    comment.parentId = parentId;
    
    // Validate that parent comment exists
    const parentComment = await db.collection("comments").findOne({ 
      _id: new ObjectId(parentId) 
    });
    
    if (!parentComment) throw new Error("Parent comment not found");
  }

  const { insertedId } = await db.collection("comments").insertOne(comment);

  const newComment = await db.collection("comments").findOne({ _id: insertedId });

  // Get the sender's socket ID from header
  const senderSocketId = req.headers["x-socket-id"] || null;
  
  console.log(`Broadcasting new comment. Sender socket ID: ${senderSocketId}`);

  // Emit to all connected clients with sender information
  req.app.get('io').emit(`comments:${fileId}`, { 
    comment: newComment, 
    senderSocketId 
  });

  return newComment;
}