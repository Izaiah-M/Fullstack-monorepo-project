import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { ValidationError, UnauthorizedError, ServerError } from '../../utils/errors.js';
import User from '../../models/User.js';
import Project from '../../models/Project.js';
import File from '../../models/File.js';
import { logger } from '../../utils/logger.js';
import * as db from '../../utils/dbHandler.js';

/**
 * Register a new user or update existing user without password
 * 
 * @param {Object} session - Session service
 * @param {Response} res - Express response
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} User ID
 * @throws {ValidationError} If user already exists
 */
export async function signupService(session, res, credentials) {
  try {
    const { email, password } = credentials;
    
    // Using findOne with required=false to not throw NotFoundError if user doesn't exist
    const existingUser = await db.findOne(User, { email }, "", "User", false);

    if (existingUser && existingUser.password) {
      throw new ValidationError('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let userId;

    if (existingUser) {
      await db.updateOne(
        User,
        { _id: existingUser._id },
        { $set: { password: hashedPassword } },
        {},
        "User"
      );
      userId = existingUser._id;
      
      logger.info('Updated existing user with password', { 
        userId: existingUser._id.toString(),
        email 
      });
    } else {
      const newUser = {
        email,
        password: hashedPassword,
      };
      const createdUser = await db.create(User, newUser, "User");
      userId = createdUser._id;
      
      logger.info('New user created', { 
        userId: createdUser._id.toString(),
        email 
      });
    }

    await session.create(res, { userId });
    return { userId };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Error in signup service', {
      error: error.message,
      stack: error.stack,
      email: credentials.email
    });
    
    throw new ServerError('Failed to create account');
  }
}

/**
 * Authenticate a user
 * 
 * @param {Object} session - Session service
 * @param {Response} res - Express response
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} User ID
 * @throws {UnauthorizedError} If credentials are invalid
 */
export async function loginService(session, res, credentials) {
  try {
    const { email, password } = credentials;
    
    // Using findOne with required=false since we're checking for null explicitly
    const user = await db.findOne(User, { email }, "", "User", false);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await session.create(res, { userId: user._id });
    
    logger.info('User logged in', { 
      userId: user._id.toString(),
      email 
    });
    
    return { userId: user._id };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error('Error in login service', {
      error: error.message,
      stack: error.stack,
      email: credentials.email
    });
    
    throw new ServerError('Authentication failed');
  }
}

/**
 * Get current session info
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @returns {Promise<Object>} User ID
 * @throws {UnauthorizedError} If not authenticated
 */
export async function getSessionService(session, req) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError('Not authenticated');
    }
    
    logger.debug('Session retrieved', { 
      userId: sessionData.userId.toString() 
    });
    
    return { userId: sessionData.userId };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error('Error retrieving session', {
      error: error.message,
      stack: error.stack
    });
    
    throw new ServerError('Failed to retrieve session');
  }
}

/**
 * Remove user account and all associated data
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @throws {UnauthorizedError} If not authenticated
 */
export async function removeAccountService(session, req, res) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError('Not authenticated');
    }
    
    const userId = sessionData.userId;
    
    // Delete user
    await db.deleteOne(User, { _id: userId }, "User");
    
    // Delete projects
    const projectResult = await db.deleteMany(Project, { authorId: userId }, "Project");
    
    // Get files
    const files = await db.find(File, { authorId: userId });
    
    const fileDeleteResults = [];
    
    // Delete each file from disk
    for (const file of files) {
      try {
        await fs.unlink(file.path);
        fileDeleteResults.push({ fileId: file._id, success: true });
      } catch (unlinkError) {
        logger.warn('Failed to delete file from disk', {
          fileId: file._id.toString(),
          path: file.path,
          error: unlinkError.message
        });
        fileDeleteResults.push({ fileId: file._id, success: false });
      }
    }
    
    // Delete file records from database
    const fileDbResult = await db.deleteMany(File, { authorId: userId }, "File");
    
    // Remove session
    await session.remove(req, res);
    
    logger.info('Account removed', {
      userId: userId.toString(),
      deletedProjects: projectResult.deletedCount,
      deletedFiles: fileDbResult.deletedCount,
      filesDeletionResults: fileDeleteResults.filter(r => !r.success).length > 0 
        ? `${fileDeleteResults.filter(r => r.success).length} of ${files.length} files deleted from disk`
        : 'All files deleted successfully'
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error('Error removing account', {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId
    });
    
    throw new ServerError('Failed to remove account');
  }
}

/**
 * Log out user
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function logoutService(session, req, res) {
  try {
    const sessionData = await session.get(req);
    await session.remove(req, res);
    
    if (sessionData && sessionData.userId) {
      logger.info('User logged out', { 
        userId: sessionData.userId.toString() 
      });
    }
  } catch (error) {
    // We log error but not throw logout should succeed even if there's an issue
    logger.warn('Error during logout', {
      error: error.message,
      stack: error.stack
    });
  }
}