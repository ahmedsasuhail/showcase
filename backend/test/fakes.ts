import type { Category, Product } from '../src/catalogue/product.js';
import { matchesSearch } from '../src/catalogue/search.js';
import type { ProductSource } from '../src/catalogue/product-source.js';
import type { EmailMessage, EmailSender } from '../src/email/email-sender.js';
import { EmailDeliveryError, ProductSourceUnavailableError } from '../src/errors.js';

/** Keeps every email instead of sending it. */
export class RecordingEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}

/** An email provider that is down. */
export class FailingEmailSender implements EmailSender {
  async send(): Promise<void> {
    throw new EmailDeliveryError('simulated SMTP outage');
  }
}

/** In-memory stand-in for the real data source. Grows with the ProductSource interface. */
export class InMemoryProductSource implements ProductSource {
  private readonly categories: Category[];
  private readonly products: Product[];

  constructor({ categories = [], products = [] }: { categories?: Category[]; products?: Product[] } = {}) {
    this.categories = categories;
    this.products = products;
  }

  async listCategories(): Promise<Category[]> {
    return this.categories;
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async getProductsByIds(ids: readonly string[]): Promise<Product[]> {
    return ids.flatMap((id) => this.products.find((p) => p.id === id) ?? []);
  }

  async searchProducts(term: string): Promise<Product[]> {
    return this.products.filter((p) => matchesSearch(p, term));
  }

  async listProductsInCategory(category: Category): Promise<Product[]> {
    return this.products.filter((p) => p.category.slug === category.slug);
  }
}

/** A data source that is down. */
export class FailingProductSource implements ProductSource {
  async listCategories(): Promise<Category[]> {
    throw new ProductSourceUnavailableError('simulated outage');
  }

  async getProduct(): Promise<Product | null> {
    throw new ProductSourceUnavailableError('simulated outage');
  }

  async getProductsByIds(): Promise<Product[]> {
    throw new ProductSourceUnavailableError('simulated outage');
  }

  async searchProducts(): Promise<Product[]> {
    throw new ProductSourceUnavailableError('simulated outage');
  }

  async listProductsInCategory(): Promise<Product[]> {
    throw new ProductSourceUnavailableError('simulated outage');
  }
}
