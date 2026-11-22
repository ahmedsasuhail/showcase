import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet } from './client';
import { jsonResponse, mockApi } from '../test/mockApi';

describe('apiGet', () => {
  it('requests a relative /api path and returns the JSON body', async () => {
    const fetchMock = mockApi({ '/api/health': () => jsonResponse({ status: 'ok' }) });

    await expect(apiGet('/health')).resolves.toEqual({ status: 'ok' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/health');
  });

  it('throws an ApiError carrying the status and the server message', async () => {
    mockApi({ '/api/x': () => jsonResponse({ error: { code: 'not_found', message: 'Nope.' } }, 404) });

    await expect(apiGet('/x')).rejects.toMatchObject({ name: 'ApiError', status: 404, message: 'Nope.' });
  });

  it('throws an ApiError when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiGet('/x')).rejects.toBeInstanceOf(ApiError);
  });
});
