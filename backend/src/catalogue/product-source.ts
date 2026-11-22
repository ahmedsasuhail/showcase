import type { Category, Product } from './product.js';

/**
 * Where product data comes from. The rest of the app depends only on this interface,
 * so replacing Fake Store means writing one new implementation.
 */
export interface ProductSource {
  listCategories(): Promise<Category[]>;
  /** Products for the given IDs, in the order requested. Unknown IDs are skipped. */
  getProductsByIds(ids: readonly string[]): Promise<Product[]>;
}
