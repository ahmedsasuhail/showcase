import type { Product } from '../src/catalogue/product.js';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    title: 'Test Jacket',
    description: 'A jacket for tests.',
    price: 49.95,
    currency: 'AUD',
    imageUrl: 'https://images.test/1.png',
    rating: 4.5,
    category: { slug: 'mens-clothing', name: "Men's clothing" },
    ...overrides,
  };
}

/** A product exactly as Fake Store sends it. */
export function upstreamProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    title: 'Mens Cotton Jacket',
    price: 55.99,
    description: 'Great outerwear jackets.',
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg',
    rating: { rate: 4.7, count: 500 },
    ...overrides,
  };
}
