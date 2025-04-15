import { ValidationError } from "./errors.js";
import Session from "../models/Session.js";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export default async function SessionService() {

  async function create(res, { userId }) {
    const session = new Session({
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    });

    await session.save();
    
    res.cookie(SESSION_COOKIE_NAME, session._id, {
      expires: session.expiresAt,
      domain: process.env.DOMAIN,
      httpOnly: true,
      sameSite: "strict",
      signed: true,
    });
  }

  async function remove(req, res) {
    const session = await get(req);
    await Session.deleteOne({ _id: session._id });
    
    res.clearCookie(SESSION_COOKIE_NAME, {
      domain: process.env.DOMAIN,
      path: "/",
      httpOnly: true,
      signed: true,
    });
  }

  async function get(req) {
    const sessionId = req.signedCookies[SESSION_COOKIE_NAME];
    if (!sessionId) {
      throw new ValidationError("No session found");
    }
    
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new ValidationError("No session found");
    }
    
    return session;
  }

  return {
    create,
    remove,
    get,
  };
}