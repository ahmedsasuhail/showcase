import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures.js';
import { matchesSearch, normaliseTerm } from './search.js';

const jacket = makeProduct({
  title: 'Mens Cotton Jacket',
  description: 'Great outerwear for hiking and camping.',
  category: { slug: 'mens-clothing', name: "Men's clothing" },
});

describe('normaliseTerm', () => {
  it('trims and collapses whitespace', () => {
    expect(normaliseTerm('  cotton \t  jacket \n')).toBe('cotton jacket');
  });
});

describe('matchesSearch', () => {
  it.each([
    ['a word in the title', 'jacket'],
    ['a different case', 'COTTON'],
    ['part of a word', 'jack'],
    ['a word in the description', 'hiking'],
    ['the category name', "men's clothing"],
    ['every word, found in different fields', 'cotton camping clothing'],
    ['extra whitespace', '  cotton   jacket '],
  ])('matches %s', (_name, term) => {
    expect(matchesSearch(jacket, term)).toBe(true);
  });

  it.each([
    ['a word that is nowhere', 'laptop'],
    ['one matching and one missing word', 'jacket laptop'],
    ['a blank term', '   '],
  ])('does not match %s', (_name, term) => {
    expect(matchesSearch(jacket, term)).toBe(false);
  });

  it('treats regular-expression characters as plain text', () => {
    expect(matchesSearch(jacket, '(')).toBe(false);
    expect(matchesSearch(jacket, '.*')).toBe(false);
  });
});
