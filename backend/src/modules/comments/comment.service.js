// src/modules/comments/comment.service.js
import { NotFoundError, UnauthorizedError } from "../../utils/errors.js";
import Comment from "../../models/Comment.js";
import { logger } from "../../utils/logger.js";

/**
 * Get comments for a file with pagination
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @param {Object} query - Query parameters
 * @param {string} query.fileId - File ID to get comments for
 * @param {number} query.page - Page number for pagination
 * @param {number} query.limit - Number of comments per page
 * @returns {Promise<Object>} Comments with pagination info
 * @throws {UnauthorizedError} If user is not authenticated
 */
export async function getComments(session, req, query) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }

    const { fileId, page = 1, limit = 10 } = query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const skip = (pageNum - 1) * limitNum;

    // Get total count and comments in parallel
    const [total, comments] = await Promise.all([
      Comment.countDocuments({ fileId }),
      Comment.find({ fileId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);
      
    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;
    
    logger.debug("Comments retrieved", { 
      fileId, 
      page: pageNum, 
      total, 
      userId: sessionData.userId 
    });
    
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
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error("Error retrieving comments", {
      error: error.message,
      fileId: query.fileId,
      stack: error.stack
    });
    
    // Unforseen error
    throw new Error(`Failed to retrieve comments: ${error.message}`);
  }
}

/**
 * Create a new comment or reply
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @param {Object} body - Comment data
 * @param {string} body.fileId - File ID to comment on
 * @param {string} body.body - Comment content
 * @param {number} body.x - X coordinate (for top-level comments)
 * @param {number} body.y - Y coordinate (for top-level comments)
 * @param {string} body.parentId - Parent comment ID (for replies)
 * @returns {Promise<Object>} Created comment
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {NotFoundError} If parent comment not found
 */
export async function createComment(session, req, body) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }

    const userId = sessionData.userId;
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
      if (!parentComment) {
        throw new NotFoundError("Parent comment not found");
      }
    }

    // Create and save the comment
    const comment = new Comment(commentData);
    await comment.save();

    // Get sender socket ID from headers
    const senderSocketId = req.headers["x-socket-id"] || null;
    
    // Emit to all connected clients with sender information
    const io = req.app.get('io');
    if (io) {
      io.emit(`comments:${fileId}`, { 
        comment, 
        senderSocketId 
      });
    }
    
    logger.info("Comment created", { 
      commentId: comment._id, 
      fileId, 
      userId, 
      isReply: !!parentId 
    });

    return comment;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error("Error creating comment", {
      error: error.message,
      fileId: body.fileId,
      userId: sessionData?.userId,
      stack: error.stack
    });
    
    throw new Error(`Failed to create comment: ${error.message}`);
  }
}