import { UnauthorizedError } from "../../utils/errors.js";
import Project from "../../models/Project.js";
import File from "../../models/File.js";
import Comment from "../../models/Comment.js";

export async function search(session, redis, req, query) {
  const sessionData = await session.get(req);
  if (!sessionData?.userId) throw new UnauthorizedError();

  const userId = sessionData.userId;
  const { q } = query;
  
  // Try to get cached results first
  const cachedResults = await redis.getSearchResults(q, userId.toString());
  if (cachedResults) {
    return cachedResults;
  }

  // If no cache, perform the search
  const searchRegex = new RegExp(q, "i");
  let results = { projects: [], files: [], comments: [] };
  const searches = [];
  
  // Project search using Mongoose
  searches.push(
    Project.find({ 
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ],
      $or: [
        { authorId: userId },
        { reviewers: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .then(data => results.projects = data)
  );
  
  // File search using Mongoose aggregate
  searches.push(
    File.aggregate([
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
    ])
    .then(data => results.files = data)
  );
  
  // Comment search using Mongoose aggregate
  searches.push(
    Comment.aggregate([
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
    ])
    .then(data => results.comments = data)
  );
  
  await Promise.all(searches);
  
  // Cache the results
  await redis.setSearchResults(q, userId.toString(), results);
  
  return results;
}