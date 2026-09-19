import { Router } from 'express';
import multer from 'multer';
import {
  addFile,
  createSession,
  deleteSession,
  exportCsv,
  generateSession,
  getSession,
  listSessions,
  regenerateSession,
  updateSession,
} from '../controllers/sessionsController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
});

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

sessionsRouter.get('/', listSessions);
sessionsRouter.post('/', createSession);
sessionsRouter.get('/:id/export.csv', exportCsv);
sessionsRouter.get('/:id', getSession);
sessionsRouter.patch('/:id', updateSession);
sessionsRouter.delete('/:id', deleteSession);
sessionsRouter.post('/:id/files', upload.single('file'), addFile);
sessionsRouter.post('/:id/generate', generateSession);
sessionsRouter.post('/:id/regenerate', regenerateSession);
