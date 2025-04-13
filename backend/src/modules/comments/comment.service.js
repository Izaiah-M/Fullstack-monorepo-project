import { UnauthorizedError } from "../../utils/errors.js";
import { ObjectId } from "mongodb";

export async function getComments(db, session, req, query) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { fileId, page = 1, limit = 10 } = query;
  
  // Convert to numbers in case they came as strings
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination info
  const total = await db.collection("comments").countDocuments({ fileId });
  
  // Get paginated comments
  const comments = await db
    .collection("comments")
    .find({ fileId })
     .sort({ 
      // First sort by whether it's a parent comment (no parentId)
      // parentId: 1, 
      // Then by creation date (newest first)
      createdAt: -1 
      // This is to help solve the issue of replies appearing before their parent
    })// to help with returnng comments newest first
    .skip(skip)
    .limit(limitNum)
    .toArray();
    
  // Calculate total pages and whether there are more comments
  const totalPages = Math.ceil(total / limitNum);
  const hasMore = pageNum < totalPages;

  // console.log("Comments: ", comments)
  
  // Return comments with pagination metadata  
  return {
    comments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      hasMore
    }
  };
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