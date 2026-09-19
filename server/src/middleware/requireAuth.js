import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.melo_token || bearer(req);
  if (!token) {
    const err = new Error('Please log in.');
    err.status = 401;
    return next(err);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-insecure-secret');
    req.userId = payload.sub;
    next();
  } catch {
    const err = new Error('Please log in again.');
    err.status = 401;
    next(err);
  }
}

function bearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7);
}
