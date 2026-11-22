import type { Category } from './product.js';
import type { ProductSource } from './product-source.js';

export class CatalogueService {
  constructor(private readonly source: ProductSource) {}

  listCategories(): Promise<Category[]> {
    return this.source.listCategories();
  }
}
