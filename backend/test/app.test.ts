import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { CatalogueService } from '../src/catalogue/catalogue.service.js';
import type { ProductSource } from '../src/catalogue/product-source.js';
import { FailingProductSource, InMemoryProductSource } from './fakes.js';

const appWith = (source: ProductSource) => createApp({ catalogue: new CatalogueService(source) });

afterEach(() => vi.restoreAllMocks());

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await request(appWith(new InMemoryProductSource())).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/categories', () => {
  it('returns the categories from the product source', async () => {
    const categories = [{ slug: 'electronics', name: 'Electronics' }];
    const res = await request(appWith(new InMemoryProductSource(categories))).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: categories });
  });

  it('returns 503 in the standard error shape when the source is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await request(appWith(new FailingProductSource())).get('/api/categories');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: {
        code: 'product_source_unavailable',
        message: 'The catalogue is temporarily unavailable. Please try again.',
      },
    });
  });
});

describe('unknown API routes', () => {
  it('return 404 in the standard error shape', async () => {
    const res = await request(appWith(new InMemoryProductSource())).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});
