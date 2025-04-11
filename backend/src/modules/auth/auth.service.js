import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { ValidationError, UnauthorizedError } from '../../utils/errors.js';

export async function signupService(db, session, res, credentials) {
  const { email, password } = credentials;
  const existingUser = await db.collection('users').findOne({ email });

  if (existingUser && existingUser.password) {
    throw new ValidationError('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let userId;

  if (existingUser) {
    await db.collection('users').updateOne(
      { _id: existingUser._id },
      { $set: { password: hashedPassword } }
    );
    userId = existingUser._id;
  } else {
    ({ insertedId: userId } = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
    }));
  }

  await session.create(res, { userId });
  return { userId };
}

export async function loginService(db, session, res, credentials) {
  const { email, password } = credentials;
  const user = await db.collection('users').findOne({ email });

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

export async function removeAccountService(db, session, req, res) {
  const { userId } = await session.get(req);
  if (!userId) {
    throw new UnauthorizedError('Not authenticated');
  }

  await db.collection('users').deleteOne({ _id: userId });
  await db.collection('projects').deleteMany({ authorId: userId });

  const files = await db.collection('files').find({ authorId: userId }).toArray();
  await Promise.all(files.map((file) => fs.unlink(file.path)));
  await db.collection('files').deleteMany({ authorId: userId });

  await session.remove(req, res);
}

export async function logoutService(session, req, res) {
  await session.remove(req, res);
}
