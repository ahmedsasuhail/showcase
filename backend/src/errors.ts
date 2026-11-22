import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

/** The product data source could not be reached or returned something unusable. */
export class ProductSourceUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProductSourceUnavailableError';
  }
}

/** The thing the caller asked for does not exist. The message is safe to show to customers. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function errorBody(code: string, message: string, details?: { field: string; message: string }[]) {
  return { error: { code, message, ...(details && { details }) } };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    res.status(400).json(errorBody('invalid_request', 'The request was not valid.', details));
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json(errorBody('not_found', err.message));
    return;
  }
  if (err instanceof ProductSourceUnavailableError) {
    console.warn(`Product source unavailable: ${err.message}`);
    res
      .status(503)
      .json(errorBody('product_source_unavailable', 'The catalogue is temporarily unavailable. Please try again.'));
    return;
  }
  console.error('Unhandled error', err);
  res.status(500).json(errorBody('internal_error', 'Something went wrong.'));
};
