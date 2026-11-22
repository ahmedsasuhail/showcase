import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('uses safe local defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({
      PORT: 3000,
      FAKE_STORE_BASE_URL: 'https://fakestoreapi.com',
      FAKE_STORE_TIMEOUT_MS: 5000,
    });
  });

  it('reads values from the environment', () => {
    const config = loadConfig({ PORT: '4000', FAKE_STORE_TIMEOUT_MS: '1000' });
    expect(config.PORT).toBe(4000);
    expect(config.FAKE_STORE_TIMEOUT_MS).toBe(1000);
  });

  it('fails fast with a readable message on invalid values', () => {
    expect(() => loadConfig({ PORT: 'abc', FAKE_STORE_BASE_URL: 'nope' })).toThrow(
      /Invalid configuration: .*PORT.*FAKE_STORE_BASE_URL/,
    );
  });
});
