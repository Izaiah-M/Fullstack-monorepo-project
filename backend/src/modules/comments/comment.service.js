import { UnauthorizedError } from "../../utils/errors.js";
import Comment from "../../models/Comment.js";

export async function getComments(session, req, query) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { fileId, page = 1, limit = 10 } = query;
  
  // Convert to numbers in case they came as strings
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination info
  const total = await Comment.countDocuments({ fileId });
  
  // Get paginated comments using Mongoose
  const comments = await Comment.find({ fileId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
    
  // Calculate total pages and whether there are more comments
  const totalPages = Math.ceil(total / limitNum);
  const hasMore = pageNum < totalPages;
  
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

export async function createComment(session, req, body) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { fileId, body: commentBody, x, y, parentId } = body;

  // Create the comment object
  const commentData = {
    fileId,
    authorId: userId,
    body: commentBody,
    createdAt: new Date(),
  };

  // Add coordinates only for top-level comments
  if (x !== undefined && y !== undefined) {
    commentData.x = x;
    commentData.y = y;
  }

  // Add parentId for replies
  if (parentId) {
    commentData.parentId = parentId;
    
    // Validate that parent comment exists
    const parentComment = await Comment.findById(parentId);
    
    if (!parentComment) throw new Error("Parent comment not found");
  }

  // Create and save the new comment using Mongoose
  const comment = new Comment(commentData);
  await comment.save();

  // Get the sender's socket ID from header
  const senderSocketId = req.headers["x-socket-id"] || null;
  
  console.log(`Broadcasting new comment. Sender socket ID: ${senderSocketId}`);

  // Emit to all connected clients with sender information
  req.app.get('io').emit(`comments:${fileId}`, { 
    comment, 
    senderSocketId 
  });

  return comment;
}