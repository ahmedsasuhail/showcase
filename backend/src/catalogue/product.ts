export interface Category {
  slug: string;
  name: string;
}

/** "men's clothing" -> "mens-clothing". Used in URLs. */
export function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
