import type { Category, Product } from './product.js';
import type { ProductSource } from './product-source.js';

export interface CatalogueOptions {
  featuredProductIds: readonly string[];
}

export class CatalogueService {
  constructor(
    private readonly source: ProductSource,
    private readonly options: CatalogueOptions,
  ) {}

  listCategories(): Promise<Category[]> {
    return this.source.listCategories();
  }

  /** The products the business chose as top rated, in the configured order. */
  async getFeatured(): Promise<Product[]> {
    const { featuredProductIds } = this.options;
    const products = await this.source.getProductsByIds(featuredProductIds);
    if (products.length < featuredProductIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = featuredProductIds.filter((id) => !found.has(id));
      console.warn(`Featured products not found in the product source: ${missing.join(', ')}`);
    }
    return products;
  }
}
