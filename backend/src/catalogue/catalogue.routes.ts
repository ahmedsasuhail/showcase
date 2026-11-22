import { Router } from 'express';
import { z } from 'zod';
import type { CatalogueService } from './catalogue.service.js';
import { normaliseTerm } from './search.js';

const searchQuery = z.object({
  q: z
    .string('Enter a search term.')
    .transform(normaliseTerm)
    .pipe(z.string().min(1, 'Enter a search term.').max(100, 'Search terms can be at most 100 characters.')),
});

export function catalogueRoutes(catalogue: CatalogueService): Router {
  const router = Router();

  router.get('/products/featured', async (_req, res) => {
    res.json({ items: await catalogue.getFeatured() });
  });

  router.get('/products', async (req, res) => {
    const { q } = searchQuery.parse(req.query);
    res.json({ query: q, items: await catalogue.search(q) });
  });

  // Must stay after /products/featured, or "featured" would be treated as an id.
  router.get('/products/:id', async (req, res) => {
    res.json(await catalogue.getProduct(req.params.id));
  });

  router.get('/categories', async (_req, res) => {
    res.json({ items: await catalogue.listCategories() });
  });

  router.get('/categories/:slug/products', async (req, res) => {
    res.json(await catalogue.getCategoryProducts(req.params.slug));
  });

  return router;
}
