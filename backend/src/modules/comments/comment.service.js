// src/modules/comments/comment.controller.js
import { NotFoundError, UnauthorizedError } from "../../utils/errors.js";
import Comment from "../../models/Comment.js";
import { logger } from "../../utils/logger.js";

export async function getComments(session, req, query) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { fileId, page = 1, limit = 10 } = query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  const skip = (pageNum - 1) * limitNum;

  const total = await Comment.countDocuments({ fileId });
  
  const comments = await Comment.find({ fileId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
    
  const totalPages = Math.ceil(total / limitNum);
  const hasMore = pageNum < totalPages;
  
  logger.debug("Comments retrieved", { fileId, page: pageNum, total });
  
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

  // Check parent comment if specified
  if (parentId) {
    commentData.parentId = parentId;
    
    const parentComment = await Comment.findById(parentId);
    if (!parentComment) throw new NotFoundError("Parent comment not found");
  }

  // Create and save the comment
  const comment = new Comment(commentData);
  await comment.save();

  // Get sender socket ID from headers
  const senderSocketId = req.headers["x-socket-id"] || null;
  
  // Emit to all connected clients with sender information
  req.app.get('io').emit(`comments:${fileId}`, { 
    comment, 
    senderSocketId 
  });
  
  logger.info("Comment created", { 
    commentId: comment._id, 
    fileId, 
    userId, 
    isReply: !!parentId 
  });

  return comment;
}