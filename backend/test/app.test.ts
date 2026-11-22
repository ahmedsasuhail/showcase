import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { CatalogueService } from '../src/catalogue/catalogue.service.js';
import type { ProductSource } from '../src/catalogue/product-source.js';
import { FailingProductSource, InMemoryProductSource } from './fakes.js';
import { makeProduct } from './fixtures.js';

const appWith = (source: ProductSource, featuredProductIds: string[] = []) =>
  createApp({ catalogue: new CatalogueService(source, { featuredProductIds }) });

afterEach(() => vi.restoreAllMocks());

const outageResponse = {
  error: {
    code: 'product_source_unavailable',
    message: 'The catalogue is temporarily unavailable. Please try again.',
  },
};

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await request(appWith(new InMemoryProductSource())).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/products/featured', () => {
  it('returns the 5 chosen products, in the chosen order, with our product shape', async () => {
    const products = ['1', '2', '3', '4', '5', '6'].map((id) => makeProduct({ id, title: `Product ${id}` }));
    const app = appWith(new InMemoryProductSource({ products }), ['5', '2', '6', '1', '3']);

    const res = await request(app).get('/api/products/featured');

    expect(res.status).toBe(200);
    expect(res.body.items.map((p: { id: string }) => p.id)).toEqual(['5', '2', '6', '1', '3']);
    expect(res.body.items[0]).toEqual(products[4]);
  });

  it('returns 503 in the standard error shape when the source is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await request(appWith(new FailingProductSource(), ['1'])).get('/api/products/featured');
    expect(res.status).toBe(503);
    expect(res.body).toEqual(outageResponse);
  });
});

describe('GET /api/products?q=', () => {
  const products = [
    makeProduct({ id: '1', title: 'Red Jacket', description: 'Warm.' }),
    makeProduct({ id: '2', title: 'Blue Jacket', description: 'Light.' }),
    makeProduct({ id: '3', title: 'Red Hat', description: 'Cosy.', category: { slug: 'hats', name: 'Hats' } }),
  ];
  const app = () => appWith(new InMemoryProductSource({ products }));

  it('returns only the products that match the search term', async () => {
    const res = await request(app()).get('/api/products').query({ q: 'jacket' });

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('jacket');
    expect(res.body.items.map((p: { id: string }) => p.id)).toEqual(['1', '2']);
  });

  it('requires every word and echoes the cleaned-up term', async () => {
    const res = await request(app()).get('/api/products').query({ q: '  RED   jacket ' });

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('RED jacket');
    expect(res.body.items.map((p: { id: string }) => p.id)).toEqual(['1']);
  });

  it('returns 200 with no items when nothing matches', async () => {
    const res = await request(app()).get('/api/products').query({ q: 'laptop' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ query: 'laptop', items: [] });
  });

  it.each([
    ['is missing', '/api/products'],
    ['is blank', '/api/products?q=%20%20'],
    ['is longer than 100 characters', `/api/products?q=${'a'.repeat(101)}`],
    ['is repeated', '/api/products?q=a&q=b'],
  ])('returns 400 with the field named when q %s', async (_name, url) => {
    const res = await request(app()).get(url);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(res.body.error.details[0].field).toBe('q');
  });

  it('returns 503 in the standard error shape when the source is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await request(appWith(new FailingProductSource())).get('/api/products?q=jacket');
    expect(res.status).toBe(503);
    expect(res.body).toEqual(outageResponse);
  });
});

describe('GET /api/categories', () => {
  it('returns the categories from the product source', async () => {
    const categories = [{ slug: 'electronics', name: 'Electronics' }];
    const res = await request(appWith(new InMemoryProductSource({ categories }))).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: categories });
  });

  it('returns 503 in the standard error shape when the source is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await request(appWith(new FailingProductSource())).get('/api/categories');
    expect(res.status).toBe(503);
    expect(res.body).toEqual(outageResponse);
  });
});

describe('GET /api/categories/:slug/products', () => {
  const electronics = { slug: 'electronics', name: 'Electronics' };
  const products = ['1', '2', '3', '4', '5'].map((id, i) =>
    makeProduct({ id, rating: i + 1, category: electronics }),
  );

  it('returns the category with its top rated products, then the additional ones', async () => {
    const app = appWith(new InMemoryProductSource({ categories: [electronics], products }));

    const res = await request(app).get('/api/categories/electronics/products');

    expect(res.status).toBe(200);
    expect(res.body.category).toEqual(electronics);
    expect(res.body.topRated.map((p: { id: string }) => p.id)).toEqual(['5', '4', '3']);
    expect(res.body.additional.map((p: { id: string }) => p.id)).toEqual(['1', '2']);
  });

  it('returns 404 in the standard error shape for an unknown category', async () => {
    const res = await request(appWith(new InMemoryProductSource({ categories: [electronics] }))).get(
      '/api/categories/toys/products',
    );
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'not_found', message: 'Category not found.' } });
  });

  it('returns 503 in the standard error shape when the source is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await request(appWith(new FailingProductSource())).get('/api/categories/electronics/products');
    expect(res.status).toBe(503);
    expect(res.body).toEqual(outageResponse);
  });
});

describe('unknown API routes', () => {
  it('return 404 in the standard error shape', async () => {
    const res = await request(appWith(new InMemoryProductSource())).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});
