import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../utils/errors.js";
import Project from "../../models/Project.js";
import User from "../../models/User.js";

export async function createProject(session, req, body) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { name } = body;

  const project = new Project({
    authorId: userId,
    name,
    reviewers: [],
    createdAt: new Date(),
  });

  await project.save();
  return project;
}

export async function getProjects(session, req) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  return Project.find({ 
    $or: [{ authorId: userId }, { reviewers: userId }] 
  }).sort({ createdAt: 1 });
}

export async function addReviewer(session, req, params, body) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const { projectId } = params;
  const { email } = body;

  const project = await Project.findById(projectId);
  if (!project) throw new NotFoundError();

  if (!project.authorId.equals(userId)) throw new ForbiddenError();

  const existingReviewer = await User.findOne({ email });
  let reviewerId;
  
  if (existingReviewer) {
    reviewerId = existingReviewer._id;
  } else {
    const newUser = new User({ email });
    await newUser.save();
    reviewerId = newUser._id;
  }

  await Project.updateOne(
    { _id: projectId }, 
    { $addToSet: { reviewers: reviewerId } }
  );

  return Project.findById(projectId);
}