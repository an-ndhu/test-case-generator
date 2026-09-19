export function errorHandler(err, _req, res, _next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Attachment must be under 1 MB.' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'That email is already registered.' });
  }

  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Session not found.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  const message =
    status === 500 ? 'Something went wrong on the server.' : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ message });
}
