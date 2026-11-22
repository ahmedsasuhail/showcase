import { Router } from 'express';
import type { CatalogueService } from './catalogue.service.js';

export function catalogueRoutes(catalogue: CatalogueService): Router {
  const router = Router();

  router.get('/products/featured', async (_req, res) => {
    res.json({ items: await catalogue.getFeatured() });
  });

  router.get('/categories', async (_req, res) => {
    res.json({ items: await catalogue.listCategories() });
  });

  router.get('/categories/:slug/products', async (req, res) => {
    res.json(await catalogue.getCategoryProducts(req.params.slug));
  });

  return router;
}
