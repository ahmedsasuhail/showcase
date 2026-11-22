import { z } from 'zod';
import { ProductSourceUnavailableError } from '../../errors.js';
import { toCategorySlug, type Category, type Product } from '../product.js';

function capitalise(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Fake Store returns category names as a plain string array. Anything else is treated as an upstream failure. */
export function toCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) {
    throw new ProductSourceUnavailableError('Fake Store categories response was not a list');
  }
  return raw
    .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
    .map((name) => ({ slug: toCategorySlug(name), name: capitalise(name) }));
}

/** The parts of a Fake Store product we rely on. Anything else it sends is ignored. */
const upstreamProduct = z.object({
  id: z.union([z.number().int(), z.string().min(1)]),
  title: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  image: z.httpUrl(),
  rating: z.object({ rate: z.number().min(0).max(5) }).optional(),
});

/** Maps one upstream product to ours, or null if it is unusable (so one bad record does not hide the rest). */
export function toProduct(raw: unknown, currency: string): Product | null {
  const parsed = upstreamProduct.safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;
  return {
    id: String(p.id),
    title: p.title,
    description: p.description,
    price: p.price,
    currency,
    imageUrl: p.image,
    rating: p.rating?.rate ?? null,
    category: { slug: toCategorySlug(p.category), name: capitalise(p.category) },
  };
}

export function toProducts(raw: unknown, currency: string): Product[] {
  if (!Array.isArray(raw)) {
    throw new ProductSourceUnavailableError('Fake Store products response was not a list');
  }
  return raw.flatMap((item) => toProduct(item, currency) ?? []);
}
