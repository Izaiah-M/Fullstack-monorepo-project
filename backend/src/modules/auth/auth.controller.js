import { CredentialsSchema } from './auth.schema.js';
import {
  signupService,
  loginService,
  getSessionService,
  removeAccountService,
  logoutService,
} from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * Auth controller factory function
 * 
 * @param {Object} params - Controller dependencies
 * @param {Object} params.session - Session service
 * @returns {Object} Controller methods
 */
export function AuthController({ session }) {
  return {
    signup: asyncHandler(async (req, res) => {
      const credentials = CredentialsSchema.parse(req.body);
      const result = await signupService(session, res, credentials);
      res.status(201).json(result);
    }),

    login: asyncHandler(async (req, res) => {
      const credentials = CredentialsSchema.parse(req.body);
      const result = await loginService(session, res, credentials);
      res.json(result);
    }),

    getSession: asyncHandler(async (req, res) => {
      const result = await getSessionService(session, req);
      res.json(result);
    }),

    removeAccount: asyncHandler(async (req, res) => {
      await removeAccountService(session, req, res);
      res.status(200).end();
    }),

    logout: asyncHandler(async (req, res) => {
      await logoutService(session, req, res);
      res.status(200).end();
    }),
  };
}