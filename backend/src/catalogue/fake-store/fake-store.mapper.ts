import { ProductSourceUnavailableError } from '../../errors.js';
import { toCategorySlug, type Category } from '../product.js';

/** Fake Store returns category names as a plain string array. Anything else is treated as an upstream failure. */
export function toCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) {
    throw new ProductSourceUnavailableError('Fake Store categories response was not a list');
  }
  return raw
    .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
    .map((name) => ({ slug: toCategorySlug(name), name: name.charAt(0).toUpperCase() + name.slice(1) }));
}
