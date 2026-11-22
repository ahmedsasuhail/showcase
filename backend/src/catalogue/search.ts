import type { Product } from './product.js';

/** Trims the term and collapses runs of whitespace. */
export function normaliseTerm(term: string): string {
  return term.trim().replace(/\s+/g, ' ');
}

/**
 * The search rule (assumption A4): case-insensitive, and every word of the term
 * must appear somewhere in the title, description or category name.
 * Plain substring matching, so characters like "(" or "." have no special meaning.
 */
export function matchesSearch(product: Product, term: string): boolean {
  const words = normaliseTerm(term).toLowerCase().split(' ').filter(Boolean);
  if (words.length === 0) return false;
  const text = `${product.title} ${product.description} ${product.category.name}`.toLowerCase();
  return words.every((word) => text.includes(word));
}
