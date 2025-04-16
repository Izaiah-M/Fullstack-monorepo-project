import { UnauthorizedError, NotFoundError } from "../../utils/errors.js";
import User from "../../models/User.js";
import { logger } from "../../utils/logger.js";
import * as db from "../../utils/dbHandler.js";

export async function getUserById(session, req, params) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }

    const { userId: targetUserId } = params;

    const user = await db.findById(User, targetUserId, "-password", "User");
    
    return user;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error("Error in getUserById", {
      error: error.message,
      userId: params.userId
    });
    
    throw new Error(`Failed to retrieve user: ${error.message}`);
  }
}