import type { ErrorRequestHandler } from 'express';

/** The product data source could not be reached or returned something unusable. */
export class ProductSourceUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProductSourceUnavailableError';
  }
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
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
