import mongoose from 'mongoose';
import { ZodError } from 'zod';

/** An error the handler sends as-is: `{ error: { code, message } }` with `status`. */
export const httpError = (status, code, message) => Object.assign(new Error(message), { status, code });

export function notFound(req, _res, next) {
  next(httpError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

/** Maps every error to the TRD §6.1 shape. Express spots error handlers by their 4 parameters. */
export function errorHandler(err, _req, res, _next) {
  let [status, code, message] = [500, 'INTERNAL', 'Something went wrong'];

  if (typeof err.code === 'string' && err.status) {
    [status, code, message] = [err.status, err.code, err.message];
  } else if (err instanceof ZodError) {
    const issue = err.issues[0];
    [status, code, message] = [400, 'VALIDATION_ERROR', `${issue.path.join('.') || 'body'}: ${issue.message}`];
  } else if (err.code === 11000) {
    [status, code, message] = [409, 'CONFLICT', 'Already exists'];
  } else if (err instanceof mongoose.Error.CastError) {
    [status, code, message] = [404, 'NOT_FOUND', 'Not found'];
  } else if (err.name === 'MulterError') {
    [status, code, message] = [400, 'VALIDATION_ERROR', err.code === 'LIMIT_FILE_SIZE' ? 'image must be 5 MB or smaller' : err.message];
  } else if (err.expose && err.status >= 400 && err.status < 500) {
    // body-parser errors: malformed JSON, body too large
    [status, code, message] = [400, 'VALIDATION_ERROR', err.message];
  }

  if (status === 500) console.error(err);
  res.status(status).json({ error: { code, message } });
}
