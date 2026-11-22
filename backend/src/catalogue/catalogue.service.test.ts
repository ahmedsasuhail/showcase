import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryProductSource } from '../../test/fakes.js';
import { makeProduct } from '../../test/fixtures.js';
import { CatalogueService } from './catalogue.service.js';

afterEach(() => vi.restoreAllMocks());

const products = ['1', '2', '3', '4'].map((id) => makeProduct({ id, title: `Product ${id}` }));
const serviceWith = (featuredProductIds: string[]) =>
  new CatalogueService(new InMemoryProductSource({ products }), { featuredProductIds });

describe('CatalogueService.getFeatured', () => {
  it('returns the chosen products in the configured order', async () => {
    const featured = await serviceWith(['3', '1', '4']).getFeatured();
    expect(featured.map((p) => p.id)).toEqual(['3', '1', '4']);
  });

  it('skips a chosen product the source does not have, and warns about it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const featured = await serviceWith(['2', '999']).getFeatured();

    expect(featured.map((p) => p.id)).toEqual(['2']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('999'));
  });
});
