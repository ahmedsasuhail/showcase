import { describe, expect, it } from 'vitest';
import { formatPrice } from './Price';

describe('formatPrice', () => {
  it('formats Australian dollars with two decimals', () => {
    expect(formatPrice(109.95, 'AUD')).toBe('$109.95');
    expect(formatPrice(7, 'AUD')).toBe('$7.00');
  });
});
