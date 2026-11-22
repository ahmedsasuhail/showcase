import { NotFoundError } from '../errors.js';
import type { Category, Product } from './product.js';
import type { ProductSource } from './product-source.js';

export interface CatalogueOptions {
  featuredProductIds: readonly string[];
}

export interface CategoryProducts {
  category: Category;
  topRated: Product[];
  additional: Product[];
}

/** How many of a category's products count as "top rated" (assumption A2). */
const TOP_RATED_PER_CATEGORY = 3;

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

  async getProduct(id: string): Promise<Product> {
    const product = await this.source.getProduct(id);
    if (!product) throw new NotFoundError('Product not found.');
    return product;
  }

  search(term: string): Promise<Product[]> {
    return this.source.searchProducts(term);
  }

  /** A category's highest-rated products first, then the rest. No product appears in both lists. */
  async getCategoryProducts(slug: string): Promise<CategoryProducts> {
    const category = (await this.source.listCategories()).find((c) => c.slug === slug);
    if (!category) throw new NotFoundError('Category not found.');

    const products = await this.source.listProductsInCategory(category);
    // Highest rating first, products without a rating last. Array.sort is stable, so ties keep the source's order.
    const topRated = [...products]
      .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
      .slice(0, TOP_RATED_PER_CATEGORY);
    const topIds = new Set(topRated.map((p) => p.id));
    return { category, topRated, additional: products.filter((p) => !topIds.has(p.id)) };
  }
}
