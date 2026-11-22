import { describe, expect, it } from 'vitest';
import { upstreamProduct } from '../../../test/fixtures.js';
import { ProductSourceUnavailableError } from '../../errors.js';
import { toProduct, toProducts } from './fake-store.mapper.js';

describe('toProduct', () => {
  it('maps a Fake Store product to ours', () => {
    expect(toProduct(upstreamProduct(), 'AUD')).toEqual({
      id: '3',
      title: 'Mens Cotton Jacket',
      description: 'Great outerwear jackets.',
      price: 55.99,
      currency: 'AUD',
      imageUrl: 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg',
      rating: 4.7,
      category: { slug: 'mens-clothing', name: "Men's clothing" },
    });
  });

  it('uses a null rating when the source has none', () => {
    expect(toProduct(upstreamProduct({ rating: undefined }), 'AUD')?.rating).toBeNull();
  });

  it('does not pass through fields we did not map', () => {
    const product = toProduct(upstreamProduct({ secret: 'x' }), 'AUD');
    expect(product).not.toHaveProperty('secret');
    expect(product).not.toHaveProperty('image');
  });

  it.each([
    ['null', null],
    ['a string', 'product'],
    ['a missing title', upstreamProduct({ title: undefined })],
    ['a negative price', upstreamProduct({ price: -1 })],
    ['a price that is not a number', upstreamProduct({ price: '55.99' })],
    ['a non-http image URL', upstreamProduct({ image: 'javascript:alert(1)' })],
    ['a rating above 5', upstreamProduct({ rating: { rate: 9 } })],
  ])('returns null for %s', (_name, raw) => {
    expect(toProduct(raw, 'AUD')).toBeNull();
  });
});

describe('toProducts', () => {
  it('drops unusable records but keeps the rest', () => {
    const result = toProducts([upstreamProduct({ id: 1 }), { id: 2 }, upstreamProduct({ id: 3 })], 'AUD');
    expect(result.map((p) => p.id)).toEqual(['1', '3']);
  });

  it('treats a response that is not a list as an upstream failure', () => {
    expect(() => toProducts({ error: 'oops' }, 'AUD')).toThrow(ProductSourceUnavailableError);
  });
});
