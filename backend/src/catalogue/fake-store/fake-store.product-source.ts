import { ProductSourceUnavailableError } from '../../errors.js';
import type { Category, Product } from '../product.js';
import type { ProductSource } from '../product-source.js';
import { matchesSearch } from '../search.js';
import { toCategories, toProducts } from './fake-store.mapper.js';

export interface FakeStoreOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Fake Store has no currency, so the business states it (assumption A9). */
  currency: string;
  /** Injected so tests never touch the network. */
  fetchFn?: typeof fetch;
}

export class FakeStoreProductSource implements ProductSource {
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: FakeStoreOptions) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async listCategories(): Promise<Category[]> {
    return toCategories(await this.get('/products/categories'));
  }

  async getProduct(id: string): Promise<Product | null> {
    return (await this.listAll()).find((product) => product.id === id) ?? null;
  }

  async getProductsByIds(ids: readonly string[]): Promise<Product[]> {
    const byId = new Map((await this.listAll()).map((product) => [product.id, product]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  async searchProducts(term: string): Promise<Product[]> {
    return (await this.listAll()).filter((product) => matchesSearch(product, term));
  }

  async listProductsInCategory(category: Category): Promise<Product[]> {
    return (await this.listAll()).filter((product) => product.category.slug === category.slug);
  }

  /** The whole catalogue is 20 products, so one request is cheaper than one per product. */
  private async listAll(): Promise<Product[]> {
    return toProducts(await this.get('/products'), this.options.currency);
  }

  /** Every upstream failure (network, timeout, non-2xx, bad JSON) becomes one domain error. */
  private async get(path: string): Promise<unknown> {
    const url = new URL(path, this.options.baseUrl);
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (cause) {
      throw new ProductSourceUnavailableError(`Could not reach Fake Store (${path})`, { cause });
    }
    if (!response.ok) {
      throw new ProductSourceUnavailableError(`Fake Store returned ${response.status} for ${path}`);
    }
    try {
      return (await response.json()) as unknown;
    } catch (cause) {
      throw new ProductSourceUnavailableError(`Fake Store returned invalid JSON for ${path}`, { cause });
    }
  }
}
