import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { sessionsRouter } from './routes/sessions.js';

export function createApp() {
  const app = express();
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(cors({ origin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use(errorHandler);

  return app;
}
