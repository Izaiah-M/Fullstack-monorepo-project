import path from "path";
import fs from "fs";
import multer from "multer";
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../utils/errors.js";
import File from "../../models/File.js";
import Project from "../../models/Project.js";
import { logger } from "../../utils/logger.js";
import * as db from "../../utils/dbHandler.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export const upload = multer({ dest: "uploads/" });

/**
 * Upload a new file to a project
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.session - Session service
 * @param {Object} params.req - Express request
 * @returns {Promise<Object>} Uploaded file information
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ValidationError} If file type is invalid
 * @throws {NotFoundError} If project is not found
 * @throws {ForbiddenError} If user doesn't have permission
 */
export async function uploadFile({ session, req }) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }
    const userId = sessionData.userId;

    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }
    
    if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        logger.warn("Failed to delete invalid file", { 
          path: req.file.path, 
          error: err.message 
        });
      }
      
      throw new ValidationError("Invalid file type");
    }

    const project = await db.findById(Project, req.body.projectId, "", "Project");
    
    if (!project.authorId.equals(userId)) {
      throw new ForbiddenError();
    }

    const file = new File({
      projectId: project._id,
      authorId: userId,
      name: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      createdAt: new Date(),
    });

    await db.create(File, file, "File");
    
    logger.info("File uploaded successfully", {
      fileId: file._id,
      projectId: project._id,
      userId,
      filename: req.file.originalname,
      size: req.file.size
    });
    
    return file;
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof ValidationError || 
        error instanceof NotFoundError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    logger.error("Error uploading file", {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId,
      projectId: req.body?.projectId,
      filename: req.file?.originalname
    });
    
    // Clean up file if there was an error after upload
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        logger.warn("Failed to delete file after error", { 
          path: req.file.path, 
          error: err.message 
        });
      }
    }
    
    // Re-throw if error is not catered for
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Get all files for a project
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.session - Session service
 * @param {Object} params.req - Express request
 * @returns {Promise<Array>} List of files
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {NotFoundError} If project is not found
 * @throws {ForbiddenError} If user doesn't have permission
 */
export async function getFiles({ session, req }) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }
    const userId = sessionData.userId;

    if (!req.query.projectId) {
      throw new ValidationError("Project ID is required");
    }

    const project = await db.findById(Project, req.query.projectId, "", "Project");

    if (
      !project.authorId.equals(userId) &&
      !project.reviewers.some((r) => r.equals(userId))
    ) {
      throw new ForbiddenError();
    }

    const files = await db.find(File, { projectId: project._id }, { sort: { createdAt: 1 } });
    
    logger.debug("Files retrieved", {
      userId,
      projectId: project._id,
      count: files.length
    });
    
    return files;
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof ValidationError || 
        error instanceof NotFoundError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    logger.error("Error retrieving files", {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId,
      projectId: req.query?.projectId
    });
    
    throw new Error(`Failed to retrieve files: ${error.message}`);
  }
}

/**
 * Get file by ID
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.session - Session service
 * @param {Object} params.req - Express request
 * @returns {Promise<Object>} File information
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {NotFoundError} If file is not found
 * @throws {ForbiddenError} If user doesn't have permission
 */
export async function getFileById({ session, req }) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData || !sessionData.userId) {
      throw new UnauthorizedError();
    }
    const userId = sessionData.userId;

    const file = await db.findById(File, req.params.id, "", "File");
    const project = await db.findById(Project, file.projectId, "", "Project");

    if (
      !file.authorId.equals(userId) &&
      !project.reviewers.some((r) => r.equals(userId))
    ) {
      throw new ForbiddenError();
    }

    logger.debug("File retrieved", {
      userId,
      fileId: file._id,
      projectId: file.projectId
    });
    
    return file;
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof NotFoundError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    logger.error("Error retrieving file", {
      error: error.message,
      stack: error.stack,
      userId: sessionData?.userId,
      fileId: req.params?.id
    });
    
    throw new Error(`Failed to retrieve file: ${error.message}`);
  }
}

/**
 * Get file content path
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.session - Session service
 * @param {Object} params.req - Express request
 * @returns {Promise<string>} Absolute file path
 * @throws {Error} If file doesn't exist on disk
 */
export async function getFileContent({ session, req }) {
  try {
    const file = await getFileById({ session, req });
    const filePath = path.join(process.cwd(), file.path);
    
    if (!fs.existsSync(filePath)) {
      logger.error("File exists in database but not on disk", {
        fileId: file._id,
        path: filePath
      });
      throw new NotFoundError("File content not found");
    }
    
    return filePath;
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof NotFoundError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    logger.error("Error retrieving file content", {
      error: error.message,
      stack: error.stack,
      fileId: req.params?.id
    });
    
    throw new Error(`Failed to retrieve file content: ${error.message}`);
  }
}