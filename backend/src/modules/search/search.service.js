import { UnauthorizedError } from "../../utils/errors.js";
import Project from "../../models/Project.js";
import File from "../../models/File.js";
import Comment from "../../models/Comment.js";
import { logger } from "../../utils/logger.js";

/**
 * Search across projects, files, and comments
 * 
 * @param {Object} session - Session service
 * @param {Object} redis - Redis client
 * @param {Request} req - Express request
 * @param {Object} query - Query parameters
 * @param {string} query.q - Search query
 * @returns {Promise<Object>} Search results
 * @throws {UnauthorizedError} If user is not authenticated
 */
export async function search(session, redis, req, query) {
  try {
    const sessionData = await session.get(req);
    if (!sessionData?.userId) {
      throw new UnauthorizedError();
    }

    const userId = sessionData.userId;
    const { q } = query;
    
    if (!q || q.trim() === '') {
      logger.debug("Empty search query, returning empty results");
      return { projects: [], files: [], comments: [] };
    }
    
    logger.info("Processing search", { 
      query: q, 
      userId: userId.toString() 
    });
    
    const cachedResults = await getCachedResults(redis, q, userId.toString());
    if (cachedResults) {
      return cachedResults;
    }

    const startTime = Date.now();
    
    const [projects, files, comments] = await Promise.all([
      searchProjects(q, userId),
      searchFiles(q, userId),
      searchComments(q, userId)
    ]);
    
    const results = { projects, files, comments };
    const totalResults = projects.length + files.length + comments.length;
    const searchTime = Date.now() - startTime;
    
    if (totalResults === 0) {
      const noResultsResponse = { 
        projects: [], 
        files: [], 
        comments: [],
        noResults: true 
      };
      
      // Cache the no-results response
      await cacheResults(redis, q, userId.toString(), noResultsResponse);
      
      logger.info(`No search results found for "${q}" (${searchTime}ms)`);
      return noResultsResponse;
    }
    
    // Cache the results
    await cacheResults(redis, q, userId.toString(), results);
    
    logger.info("Search results found", {
      query: q,
      time: `${searchTime}ms`,
      counts: {
        projects: projects.length,
        files: files.length,
        comments: comments.length
      }
    });
    
    return results;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error("Error performing search", {
      error: error.message,
      stack: error.stack,
      query: query.q,
      userId: sessionData?.userId
    });
    
    throw new Error(`Search failed: ${error.message}`);
  }
}

// Below are some helper functions to handle the search logic

/**
 * Search for projects matching the query
 * 
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Matching projects
 */
async function searchProjects(query, userId) {
  try {
    const searchRegex = new RegExp(query, "i");
    return await Project.find({ 
      $and: [
        { 
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        },
        {
          $or: [
            { authorId: userId },
            { reviewers: userId }
          ]
        }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5);
  } catch (error) {
    logger.error("Error in project search", { 
      error: error.message,
      query
    });
    return []; 
  }
}

/**
 * Search for files matching the query
 * 
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Matching files
 */
async function searchFiles(query, userId) {
  try {
    const searchRegex = new RegExp(query, "i");
    return await File.aggregate([
      {
        $match: {
          name: searchRegex
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project"
        }
      },
      {
        $unwind: "$project"
      },
      {
        $match: {
          $or: [
            { "project.authorId": userId },
            { "project.reviewers": userId }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          projectId: 1,
          authorId: 1,
          path: 1,
          createdAt: 1,
          "project.name": 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 5
      }
    ]);
  } catch (error) {
    logger.error("Error in file search", { 
      error: error.message,
      query
    });
    return []; 
  }
}

/**
 * Search for comments matching the query
 * 
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Matching comments
 */
async function searchComments(query, userId) {
  try {
    const searchRegex = new RegExp(query, "i");
    return await Comment.aggregate([
      {
        $match: { 
          body: searchRegex 
        }
      },
      {
        $lookup: {
          from: "files",
          localField: "fileId",
          foreignField: "_id",
          as: "file"
        }
      },
      {
        $unwind: "$file"
      },
      {
        $lookup: {
          from: "projects",
          localField: "file.projectId",
          foreignField: "_id",
          as: "project"
        }
      },
      {
        $unwind: "$project"
      },
      {
        $match: {
          $or: [
            { "project.authorId": userId },
            { "project.reviewers": userId }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          fileId: 1,
          authorId: 1,
          body: 1,
          x: 1,
          y: 1,
          parentId: 1,
          createdAt: 1,
          "file.name": 1,
          "project.name": 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 5
      }
    ]);
  } catch (error) {
    logger.error("Error in comment search", { 
      error: error.message,
      query
    });
    return []; 
  }
}

/**
 * Try to retrieve cached search results
 * 
 * @param {Object} redis - Redis client
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Cached results or null
 */
async function getCachedResults(redis, query, userId) {
  try {
    const cachedResults = await redis.getSearchResults(query, userId);
    if (cachedResults) {
      logger.debug("Returning cached search results", { 
        query, 
        resultCount: {
          projects: cachedResults.projects.length,
          files: cachedResults.files.length,
          comments: cachedResults.comments.length
        }
      });
      return cachedResults;
    }
  } catch (cacheError) {
    logger.warn("Failed to retrieve cached search results", { 
      error: cacheError.message,
      query
    });
  }
  return null;
}

/**
 * Cache search results
 * 
 * @param {Object} redis - Redis client
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @param {Object} results - Search results to cache
 */
async function cacheResults(redis, query, userId, results) {
  try {
    await redis.setSearchResults(query, userId, results);
  } catch (cacheError) {
    logger.warn("Failed to cache search results", { 
      error: cacheError.message,
      query
    });
  }
}
