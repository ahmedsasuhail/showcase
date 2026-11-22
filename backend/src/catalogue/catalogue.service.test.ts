import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryProductSource } from '../../test/fakes.js';
import { makeProduct } from '../../test/fixtures.js';
import { NotFoundError } from '../errors.js';
import { CatalogueService } from './catalogue.service.js';
import type { Category } from './product.js';

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

describe('CatalogueService.getCategoryProducts', () => {
  const electronics: Category = { slug: 'electronics', name: 'Electronics' };
  const jewelery: Category = { slug: 'jewelery', name: 'Jewelery' };
  const inElectronics = (id: string, rating: number | null) => makeProduct({ id, rating, category: electronics });

  function serviceFor(items: ReturnType<typeof makeProduct>[]) {
    const source = new InMemoryProductSource({ categories: [electronics, jewelery], products: items });
    return new CatalogueService(source, { featuredProductIds: [] });
  }

  it('puts the 3 highest-rated products first and the rest in additional, with no overlap', async () => {
    const service = serviceFor([
      inElectronics('a', 3.0),
      inElectronics('b', 4.8),
      inElectronics('c', 2.1),
      inElectronics('d', 4.1),
      inElectronics('e', 4.6),
      makeProduct({ id: 'other', rating: 5, category: jewelery }),
    ]);

    const result = await service.getCategoryProducts('electronics');

    expect(result.category).toEqual(electronics);
    expect(result.topRated.map((p) => p.id)).toEqual(['b', 'e', 'd']);
    expect(result.additional.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('keeps the source order for equal ratings and ranks unrated products last', async () => {
    const service = serviceFor([
      inElectronics('a', null),
      inElectronics('b', 4),
      inElectronics('c', 4),
      inElectronics('d', 4),
      inElectronics('e', 4),
    ]);

    const result = await service.getCategoryProducts('electronics');

    expect(result.topRated.map((p) => p.id)).toEqual(['b', 'c', 'd']);
    expect(result.additional.map((p) => p.id)).toEqual(['a', 'e']);
  });

  it('returns an empty additional list for a small category', async () => {
    const result = await serviceFor([inElectronics('a', 4), inElectronics('b', 3)]).getCategoryProducts('electronics');
    expect(result.topRated.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result.additional).toEqual([]);
  });

  it('throws NotFoundError for an unknown category', async () => {
    await expect(serviceFor([]).getCategoryProducts('toys')).rejects.toBeInstanceOf(NotFoundError);
  });
});
