const logger = require('../utils/logger');

/**
 * Global Express error handler.
 * Must have 4 parameters — Express identifies it as error middleware by arity.
 *
 * Usage in routes: next(error) or next(createError(400, 'Bad input'))
 */
const errorHandler = (err, req, res, next) => {
  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[ERROR] ${req.method} ${req.path} → ${status}: ${message}`, {
    ...(isDev && { stack: err.stack }),
    doctorId: req.doctor?.uid,
  });

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : message,
    ...(isDev && { details: message, stack: err.stack }),
  });
};

/** Convenience factory for HTTP errors */
const createError = (status, message) => {
  const err = new Error(message);
  err.statusCode = status;
  return err;
};

module.exports = { errorHandler, createError };
