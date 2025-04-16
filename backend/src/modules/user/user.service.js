import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
import User from "../../models/User.js";
import { logger } from "../../utils/logger.js";

export async function getUserById(session, req, params) {
  try {
    // Verify authentication
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }

    const { userId: targetUserId } = params;

    // Try to find the user
    const user = await User.findById(targetUserId).select("-password");

    if (!user) {
      throw new NotFoundError(`User with ID ${targetUserId} not found`);
    }

    return user;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error("Error in getUserById", {
      error: error.message,
      userId: params.userId
    });
    
    // Re-throw with generic message
    throw new Error(`Failed to retrieve user: ${error.message}`);
  }
}