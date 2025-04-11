import path from "path";
import fs from "fs";
import multer from "multer";
import { ObjectId } from "mongodb";
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../utils/errors.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export const upload = multer({ dest: "uploads/" });

export async function uploadFile({ db, session, req }) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
    throw new ValidationError("Invalid file type");
  }

  const project = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(req.body.projectId) });

  if (!project) throw new NotFoundError("Project not found");
  if (!project.authorId.equals(userId)) throw new ForbiddenError();

  const { insertedId } = await db.collection("files").insertOne({
    projectId: project._id,
    authorId: userId,
    name: req.file.originalname,
    path: req.file.path,
    createdAt: new Date(),
  });

  return db.collection("files").findOne({ _id: insertedId });
}

export async function getFiles({ db, session, req }) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const project = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(req.query.projectId) });

  if (!project) throw new NotFoundError("Project not found");

  if (
    !project.authorId.equals(userId) &&
    !project.reviewers.some((r) => r.equals(userId))
  ) {
    throw new ForbiddenError();
  }

  return db
    .collection("files")
    .find({ projectId: project._id }, { sort: { createdAt: 1 } })
    .toArray();
}

export async function getFileById({ db, session, req }) {
  const { userId } = await session.get(req);
  if (!userId) throw new UnauthorizedError();

  const file = await db
    .collection("files")
    .findOne({ _id: new ObjectId(req.params.id) });

  if (!file) throw new NotFoundError("File not found");

  const project = await db
    .collection("projects")
    .findOne({ _id: file.projectId });

  if (
    !file.authorId.equals(userId) &&
    !project.reviewers.some((r) => r.equals(userId))
  ) {
    throw new ForbiddenError();
  }

  return file;
}

export async function getFileContent({ db, session, req }) {
  const file = await getFileById({ db, session, req });
  return path.join(process.cwd(), file.path);
}
