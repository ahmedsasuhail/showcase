import { describe, expect, it, vi } from 'vitest';
import { ProductSourceUnavailableError } from '../../errors.js';
import { FakeStoreProductSource } from './fake-store.product-source.js';

function sourceWith(fetchFn: typeof fetch) {
  return new FakeStoreProductSource({ baseUrl: 'https://fake.test', timeoutMs: 1000, fetchFn });
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('FakeStoreProductSource.listCategories', () => {
  it('maps upstream category names to categories with slugs', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => jsonResponse(["men's clothing", 'electronics']));

    const categories = await sourceWith(fetchFn).listCategories();

    expect(categories).toEqual([
      { slug: 'mens-clothing', name: "Men's clothing" },
      { slug: 'electronics', name: 'Electronics' },
    ]);
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe('https://fake.test/products/categories');
  });

  it('skips entries that are not usable names', async () => {
    const fetchFn = async () => jsonResponse(['electronics', 42, null, '  ']);
    expect(await sourceWith(fetchFn as typeof fetch).listCategories()).toEqual([
      { slug: 'electronics', name: 'Electronics' },
    ]);
  });

  it.each([
    ['network failure', async () => Promise.reject(new TypeError('fetch failed'))],
    ['non-2xx status', async () => jsonResponse({}, 500)],
    ['invalid JSON', async () => new Response('<html>oops</html>')],
    ['unexpected shape', async () => jsonResponse({ not: 'a list' })],
  ])('throws ProductSourceUnavailableError on %s', async (_name, fetchFn) => {
    await expect(sourceWith(fetchFn as typeof fetch).listCategories()).rejects.toBeInstanceOf(
      ProductSourceUnavailableError,
    );
  });
});
