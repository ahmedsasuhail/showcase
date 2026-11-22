import { describe, expect, it } from 'vitest';
import { toCategorySlug } from './product.js';

describe('toCategorySlug', () => {
  it.each([
    ["men's clothing", 'mens-clothing'],
    ["women's clothing", 'womens-clothing'],
    ['electronics', 'electronics'],
    ['  Home & Garden!  ', 'home-garden'],
  ])('turns %j into %j', (name, slug) => {
    expect(toCategorySlug(name)).toBe(slug);
  });
});
