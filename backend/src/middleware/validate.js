import { ZodError } from 'zod';
import { httpError } from './errorHandler.js';

// Format Zod issues into a single human-readable 400 message.
function formatZodError(error) {
  const message = error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
  return httpError(400, message);
}


export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
      if (schemas.query) req.query = schemas.query.parse(req.query ?? {});
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(formatZodError(err));
      }
      next(err);
    }
  };
}
