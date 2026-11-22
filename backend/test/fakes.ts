import { ProductSourceUnavailableError } from '../src/errors.js';
import type { Category } from '../src/catalogue/product.js';
import type { ProductSource } from '../src/catalogue/product-source.js';

/** In-memory stand-in for the real data source. Grows with the ProductSource interface. */
export class InMemoryProductSource implements ProductSource {
  constructor(private readonly categories: Category[] = []) {}

  async listCategories(): Promise<Category[]> {
    return this.categories;
  }
}

/** A data source that is down. */
export class FailingProductSource implements ProductSource {
  async listCategories(): Promise<Category[]> {
    throw new ProductSourceUnavailableError('simulated outage');
  }
}
