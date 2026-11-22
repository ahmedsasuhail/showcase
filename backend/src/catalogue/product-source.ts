import type { Category } from './product.js';

/**
 * Where product data comes from. The rest of the app depends only on this interface,
 * so replacing Fake Store means writing one new implementation.
 */
export interface ProductSource {
  listCategories(): Promise<Category[]>;
}
