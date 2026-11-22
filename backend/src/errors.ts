import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

/** The product data source could not be reached or returned something unusable. */
export class ProductSourceUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProductSourceUnavailableError';
  }
}

/** The email provider did not accept the message. */
export class EmailDeliveryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailDeliveryError';
  }
}

/** The thing the caller asked for does not exist. The message is safe to show to customers. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** The request is valid but cannot be acted on, e.g. an enquiry about a product that no longer exists. */
export class UnprocessableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnprocessableError';
  }
}

export function errorBody(code: string, message: string, details?: { field: string; message: string }[]) {
  return { error: { code, message, ...(details && { details }) } };
}

/** express.json() rejects unreadable bodies (bad JSON, too large) with an HTTP status and `expose: true`. */
function isUnreadableBodyError(err: unknown): err is { status: number } {
  if (typeof err !== 'object' || err === null) return false;
  const { status, expose } = err as { status?: unknown; expose?: unknown };
  return expose === true && typeof status === 'number' && status >= 400 && status < 500;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    res.status(400).json(errorBody('invalid_request', 'The request was not valid.', details));
    return;
  }
  if (isUnreadableBodyError(err)) {
    res.status(err.status).json(errorBody('invalid_request', 'The request body could not be read.'));
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json(errorBody('not_found', err.message));
    return;
  }
  if (err instanceof UnprocessableError) {
    res.status(422).json(errorBody('unprocessable', err.message));
    return;
  }
  if (err instanceof ProductSourceUnavailableError) {
    console.warn(`Product source unavailable: ${err.message}`);
    res
      .status(503)
      .json(errorBody('product_source_unavailable', 'The catalogue is temporarily unavailable. Please try again.'));
    return;
  }
  if (err instanceof EmailDeliveryError) {
    // The message is ours and never contains customer details; the provider's error (the cause) is not logged.
    console.warn(`Email delivery failed: ${err.message}`);
    res.status(503).json(errorBody('email_unavailable', 'We couldn’t send your enquiry. Please try again.'));
    return;
  }
  console.error('Unhandled error', err);
  res.status(500).json(errorBody('internal_error', 'Something went wrong.'));
};
