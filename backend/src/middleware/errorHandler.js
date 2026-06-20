// Central error handler. Known errors carry a `status`; everything else is 500.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Helper to throw an error with a specific HTTP status.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
