import { ProductSourceUnavailableError } from '../../errors.js';
import type { Category } from '../product.js';
import type { ProductSource } from '../product-source.js';
import { toCategories } from './fake-store.mapper.js';

export interface FakeStoreOptions {
  baseUrl: string;
  timeoutMs: number;
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
