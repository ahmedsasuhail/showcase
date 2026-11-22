import express, { type Express } from 'express';
import { catalogueRoutes } from './catalogue/catalogue.routes.js';
import type { CatalogueService } from './catalogue/catalogue.service.js';
import { enquiriesRoutes } from './enquiries/enquiries.routes.js';
import type { EnquiriesService } from './enquiries/enquiries.service.js';
import { errorBody, errorHandler } from './errors.js';

export interface AppDependencies {
  catalogue: CatalogueService;
  enquiries: EnquiriesService;
}

/** Builds the HTTP app from its dependencies. Tests pass fakes; server.ts passes the real adapters. */
export function createApp({ catalogue, enquiries }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  // An enquiry is a few hundred bytes; anything much larger is not one.
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', catalogueRoutes(catalogue));
  app.use('/api', enquiriesRoutes(enquiries));
  app.use('/api', (_req, res) => {
    res.status(404).json(errorBody('not_found', 'No such endpoint.'));
  });
  app.use(errorHandler);

  return app;
}
