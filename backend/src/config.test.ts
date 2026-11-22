import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('uses safe local defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({
      PORT: 3000,
      FAKE_STORE_BASE_URL: 'https://fakestoreapi.com',
      FAKE_STORE_TIMEOUT_MS: 5000,
      CATALOGUE_CURRENCY: 'AUD',
      FEATURED_PRODUCT_IDS: ['3', '5', '11', '12', '18'],
    });
  });

  it('reads values from the environment', () => {
    const config = loadConfig({
      PORT: '4000',
      FAKE_STORE_TIMEOUT_MS: '1000',
      CATALOGUE_CURRENCY: 'USD',
      FEATURED_PRODUCT_IDS: ' 7, 2 ,9',
    });
    expect(config.PORT).toBe(4000);
    expect(config.FAKE_STORE_TIMEOUT_MS).toBe(1000);
    expect(config.CATALOGUE_CURRENCY).toBe('USD');
    expect(config.FEATURED_PRODUCT_IDS).toEqual(['7', '2', '9']);
  });

  it('fails fast with a readable message on invalid values', () => {
    expect(() => loadConfig({ PORT: 'abc', FAKE_STORE_BASE_URL: 'nope' })).toThrow(
      /Invalid configuration: .*PORT.*FAKE_STORE_BASE_URL/,
    );
  });

  it.each([
    ['a lowercase currency', { CATALOGUE_CURRENCY: 'aud' }, /CATALOGUE_CURRENCY/],
    ['an empty featured list', { FEATURED_PRODUCT_IDS: '' }, /FEATURED_PRODUCT_IDS/],
    ['an unsafe featured id', { FEATURED_PRODUCT_IDS: '1,../2' }, /FEATURED_PRODUCT_IDS/],
  ])('rejects %s', (_name, env, message) => {
    expect(() => loadConfig(env)).toThrow(message);
  });
});
