import { UnauthorizedError } from "../../utils/errors.js";
import { ObjectId } from "mongodb";

export async function search(db, session, redis, req, query) {
  const sessionData = await session.get(req);
  if (!sessionData?.userId) throw new UnauthorizedError();

  const userId = new ObjectId(sessionData.userId);
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
  
  // Project search
  searches.push(
    db.collection("projects")
      .find({ 
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
      .toArray()
      .then(data => results.projects = data)
  );
  
  // File search
  searches.push(
    db.collection("files")
      .aggregate([
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
      .toArray()
      .then(data => results.files = data)
  );
  
  // Comment search
  searches.push(
    db.collection("comments")
      .aggregate([
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
      .toArray()
      .then(data => results.comments = data)
  );
  
  await Promise.all(searches);
  
  // Cache the results
  await redis.setSearchResults(q, userId.toString(), results);
  
  return results;
}