import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { ValidationError, UnauthorizedError } from '../../utils/errors.js';
import User from '../../models/User.js';
import Project from '../../models/Project.js';
import File from '../../models/File.js';

export async function signupService(session, res, credentials) {
  const { email, password } = credentials;
  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.password) {
    throw new ValidationError('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let userId;

  if (existingUser) {
    await User.updateOne(
      { _id: existingUser._id },
      { $set: { password: hashedPassword } }
    );
    userId = existingUser._id;
  } else {
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    await newUser.save();
    userId = newUser._id;
  }

  await session.create(res, { userId });
  return { userId };
}

export async function loginService(session, res, credentials) {
  const { email, password } = credentials;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Invalid credentials');
  }

  await session.create(res, { userId: user._id });
  return { userId: user._id };
}

export async function getSessionService(session, req) {
  const { userId } = await session.get(req);
  if (!userId) {
    throw new UnauthorizedError('Not authenticated');
  }
  return { userId };
}

export async function removeAccountService(session, req, res) {
  const { userId } = await session.get(req);
  if (!userId) {
    throw new UnauthorizedError('Not authenticated');
  }

  await User.deleteOne({ _id: userId });
  await Project.deleteMany({ authorId: userId });

  const files = await File.find({ authorId: userId });
  await Promise.all(files.map((file) => fs.unlink(file.path)));
  await File.deleteMany({ authorId: userId });

  await session.remove(req, res);
}

export async function logoutService(session, req, res) {
  await session.remove(req, res);
}