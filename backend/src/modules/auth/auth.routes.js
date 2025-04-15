import { Router } from 'express';
import { AuthController } from './auth.controller.js';

export default function AuthRoutes({ session }) {
  const router = Router();
  const controller = AuthController({ session });

  router.post('/signup', controller.signup);
  router.post('/login', controller.login);
  router.get('/session', controller.getSession);
  router.post('/remove-account', controller.removeAccount);
  router.post('/logout', controller.logout);

  return router;
}
