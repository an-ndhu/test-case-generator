import { Router } from 'express';
import { changePassword, login, logout, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
authRouter.patch('/password', requireAuth, changePassword);
