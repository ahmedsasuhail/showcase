import type { Category, Product } from './product.js';

/**
 * Where product data comes from. The rest of the app depends only on this interface,
 * so replacing Fake Store means writing one new implementation.
 */
export interface ProductSource {
  listCategories(): Promise<Category[]>;
  /** One product, or null if the source has no product with that ID. */
  getProduct(id: string): Promise<Product | null>;
  /** Products for the given IDs, in the order requested. Unknown IDs are skipped. */
  getProductsByIds(ids: readonly string[]): Promise<Product[]>;
  /**
   * Products matching a search term (already trimmed and validated). Implementations apply
   * `matchesSearch`, or hand the term to a real search engine that does the equivalent.
   */
  searchProducts(term: string): Promise<Product[]>;
  /** Every product in the category, in the source's own order. */
  listProductsInCategory(category: Category): Promise<Product[]>;
}
