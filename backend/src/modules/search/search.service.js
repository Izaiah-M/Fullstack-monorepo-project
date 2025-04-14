import { UnauthorizedError } from "../../utils/errors.js";
import { ObjectId } from "mongodb";

export async function search(db, session, req, query) {
  const sessionData = await session.get(req);
  if (!sessionData?.userId) throw new UnauthorizedError();

  const userId = new ObjectId(sessionData.userId);
  const { q, types } = query;
  
  // Create a safe regex pattern
  const searchRegex = new RegExp(q, "i");
  
  let results = { projects: [], files: [], comments: [] };
  const searches = [];
  
  if (types.includes("projects")) {
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
  }
  
  if (types.includes("files")) {
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
              project: {
                name: "$project.name"
              }
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
  }
  
  if (types.includes("comments")) {
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
              file: {
                name: "$file.name"
              },
              project: {
                name: "$project.name"
              }
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
  }
  
  await Promise.all(searches);
  console.log("Search results:", results); // Add logging
  return results;
}
