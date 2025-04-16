import { ValidationError } from "./errors.js";
import Session from "../models/Session.js";
import * as db from "./dbHandler.js";
import { logger } from "./logger.js";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export default async function SessionService() {

  async function create(res, { userId }) {
    try {
      const sessionData = {
        userId,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      };

      const session = await db.create(Session, sessionData, "Session");
      
      res.cookie(SESSION_COOKIE_NAME, session._id, {
        expires: session.expiresAt,
        domain: process.env.DOMAIN,
        httpOnly: true,
        sameSite: "strict",
        signed: true,
      });
    } catch (error) {
      logger.error("Error creating session", {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  async function remove(req, res) {
    try {
      const session = await get(req);
      await db.deleteOne(Session, { _id: session._id }, "Session");
      
      res.clearCookie(SESSION_COOKIE_NAME, {
        domain: process.env.DOMAIN,
        path: "/",
        httpOnly: true,
        signed: true,
      });
    } catch (error) {
      // If session doesn't exist, we still want to clear the cookie
      res.clearCookie(SESSION_COOKIE_NAME, {
        domain: process.env.DOMAIN,
        path: "/",
        httpOnly: true,
        signed: true,
      });
      
      // Only log if it's not a ValidationError (which is expected if no session)
      if (!(error instanceof ValidationError)) {
        logger.error("Error removing session", {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }

  async function get(req) {
    try {
      const sessionId = req.signedCookies[SESSION_COOKIE_NAME];
      if (!sessionId) {
        throw new ValidationError("No session found");
      }
      
      try {
        const session = await db.findById(Session, sessionId, "", "Session");
        return session;
      } catch (error) {
        throw new ValidationError("No session found");
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error("Error retrieving session", {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  return {
    create,
    remove,
    get,
  };
}