import {
    UnauthorizedError,
    NotFoundError,
    ForbiddenError,
  } from "../../utils/errors.js";
  
  export async function createProject(db, session, req, body) {
    const { userId } = await session.get(req);
    if (!userId) throw new UnauthorizedError();
  
    const { name } = body;
  
    const { insertedId } = await db.collection("projects").insertOne({
      authorId: userId,
      name,
      reviewers: [],
      createdAt: new Date(),
    });
  
    return db.collection("projects").findOne({ _id: insertedId });
  }
  
  export async function getProjects(db, session, req) {
    const { userId } = await session.get(req);
    if (!userId) throw new UnauthorizedError();
  
    return db
      .collection("projects")
      .find(
        { $or: [{ authorId: userId }, { reviewers: userId }] },
        { sort: { createdAt: 1 } }
      )
      .toArray();
  }
  
  export async function addReviewer(db, session, req, params, body) {
    const { userId } = await session.get(req);
    if (!userId) throw new UnauthorizedError();
  
    const { projectId } = params;
    const { email } = body;
  
    const project = await db.collection("projects").findOne({ _id: projectId });
    if (!project) throw new NotFoundError();
  
    if (!project.authorId.equals(userId)) throw new ForbiddenError();
  
    const existingReviewer = await db.collection("users").findOne({ email });
    let reviewerId;
    if (existingReviewer) {
      reviewerId = existingReviewer._id;
    } else {
      ({ insertedId: reviewerId } = await db
        .collection("users")
        .insertOne({ email }));
    }
  
    await db
      .collection("projects")
      .updateOne({ _id: projectId }, { $addToSet: { reviewers: reviewerId } });
  
    return db.collection("projects").findOne({ _id: projectId });
  }
  