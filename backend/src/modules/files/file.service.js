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

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export const upload = multer({ dest: "uploads/" });

export async function uploadFile({ session, req }) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
    throw new ValidationError("Invalid file type");
  }

  const project = await Project.findById(req.body.projectId);

  if (!project) throw new NotFoundError("Project not found");
  if (!project.authorId.equals(userId)) throw new ForbiddenError();

  const file = new File({
    projectId: project._id,
    authorId: userId,
    name: req.file.originalname,
    path: req.file.path,
    createdAt: new Date(),
  });

  await file.save();
  return file;
}

export async function getFiles({ session, req }) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const project = await Project.findById(req.query.projectId);

  if (!project) throw new NotFoundError("Project not found");

  if (
    !project.authorId.equals(userId) &&
    !project.reviewers.some((r) => r.equals(userId))
  ) {
    throw new ForbiddenError();
  }

  return File.find({ projectId: project._id }).sort({ createdAt: 1 });
}

export async function getFileById({ session, req }) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const file = await File.findById(req.params.id);

  if (!file) throw new NotFoundError("File not found");

  const project = await Project.findById(file.projectId);

  if (
    !file.authorId.equals(userId) &&
    !project.reviewers.some((r) => r.equals(userId))
  ) {
    throw new ForbiddenError();
  }

  return file;
}

export async function getFileContent({ session, req }) {
  const file = await getFileById({ session, req });
  return path.join(process.cwd(), file.path);
}