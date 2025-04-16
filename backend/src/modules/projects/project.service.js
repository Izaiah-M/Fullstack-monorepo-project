import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../utils/errors.js";
import Project from "../../models/Project.js";
import User from "../../models/User.js";
import { logger } from "../../utils/logger.js";
import * as db from "../../utils/dbHandler.js";

/**
 * Create a new project
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @param {Object} body - Request body
 * @param {string} body.name - Project name
 * @returns {Promise<Object>} Created project
 * @throws {UnauthorizedError} If user is not authenticated
 */
export async function createProject(session, req, body) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }
    const userId = sessionData.userId;

    const { name } = body;

    const project = new Project({
      authorId: userId,
      name,
      reviewers: [],
      createdAt: new Date(),
    });

    await db.create(Project, project, "Project");
    
    logger.info("Project created", {
      projectId: project._id,
      userId,
      name
    });
    
    return project;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error("Error creating project", {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId,
      projectName: body.name
    });
    
    throw new Error(`Failed to create project: ${error.message}`);
  }
}

/**
 * Get all projects for a user (as author or reviewer)
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @returns {Promise<Array>} List of projects
 * @throws {UnauthorizedError} If user is not authenticated
 */
export async function getProjects(session, req) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }
    const userId = sessionData.userId;

    const projects = await db.find(
      Project, 
      { $or: [{ authorId: userId }, { reviewers: userId }] },
      { sort: { createdAt: 1 } }
    );
    
    logger.debug("Projects retrieved", {
      userId,
      count: projects.length
    });
    
    return projects;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error("Error retrieving projects", {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId
    });
    
    throw new Error(`Failed to retrieve projects: ${error.message}`);
  }
}

/**
 * Add a reviewer to a project
 * 
 * @param {Object} session - Session service
 * @param {Request} req - Express request
 * @param {Object} params - Route parameters
 * @param {string} params.projectId - Project ID
 * @param {Object} body - Request body
 * @param {string} body.email - Reviewer email
 * @returns {Promise<Object>} Updated project
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {NotFoundError} If project is not found
 * @throws {ForbiddenError} If user doesn't have permission
 */
export async function addReviewer(session, req, params, body) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }
    const userId = sessionData.userId;

    const { projectId } = params;
    const { email } = body;

    const project = await db.findById(Project, projectId, "", "Project");

    if (!project.authorId.equals(userId)) {
      throw new ForbiddenError("Only the project owner can add reviewers");
    }

    // Using findOne with required=false to not throw NotFoundError if user doesn't exist
    const existingReviewer = await db.findOne(User, { email }, "", "User", false);
    let reviewerId;
    
    if (existingReviewer) {
      reviewerId = existingReviewer._id;
      
      if (project.reviewers.some(r => r.equals(reviewerId))) {
        logger.info("Reviewer already added to project", {
          projectId,
          reviewerEmail: email,
          reviewerId
        });
        return project;
      }
    } else {
      const newUser = new User({ email });
      await db.create(User, newUser, "User");
      reviewerId = newUser._id;
      
      logger.info("Created new user for reviewer", {
        reviewerId: newUser._id,
        email
      });
    }

    await db.updateOne(
      Project,
      { _id: projectId },
      { $addToSet: { reviewers: reviewerId } },
      {},
      "Project"
    );

    const updatedProject = await db.findById(Project, projectId, "", "Project");
    
    logger.info("Reviewer added to project", {
      projectId,
      reviewerEmail: email,
      reviewerId
    });
    
    return updatedProject;
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof NotFoundError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    logger.error("Error adding reviewer", {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId,
      projectId: params.projectId,
      reviewerEmail: body.email
    });
    
    throw new Error(`Failed to add reviewer: ${error.message}`);
  }
}