export interface Category {
  slug: string;
  name: string;
}

export interface Product {
  /** A string so a future data source with non-numeric IDs does not break clients. */
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  /** Average rating out of 5, or null when the source has none. */
  rating: number | null;
  category: Category;
}

/** "men's clothing" -> "mens-clothing". Used in URLs. */
export function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
