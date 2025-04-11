import { CredentialsSchema } from './auth.schema.js';
import {
  signupService,
  loginService,
  getSessionService,
  removeAccountService,
  logoutService,
} from './auth.service.js';

export function AuthController({ db, session }) {
  return {
    signup: async (req, res) => {
      const credentials = CredentialsSchema.parse(req.body);
      const result = await signupService(db, session, res, credentials);
      res.status(201).json(result);
    },

    login: async (req, res) => {
      const credentials = CredentialsSchema.parse(req.body);
      const result = await loginService(db, session, res, credentials);
      res.json(result);
    },

    getSession: async (req, res) => {
      const result = await getSessionService(session, req);
      res.json(result);
    },

    removeAccount: async (req, res) => {
      await removeAccountService(db, session, req, res);
      res.status(200).end();
    },

    logout: async (req, res) => {
      await logoutService(session, req, res);
      res.status(200).end();
    },
  };
}
