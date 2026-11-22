import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jsonResponse, mockApi } from '../test/mockApi';
import { useApi } from './useApi';

describe('useApi', () => {
  it('shows loading, not the previous data, when the path changes', async () => {
    mockApi({
      '/api/a': () => jsonResponse({ name: 'a' }),
      '/api/b': () => new Promise<Response>(() => {}), // never resolves
    });

    const { result, rerender } = renderHook(({ path }) => useApi<{ name: string }>(path), {
      initialProps: { path: '/a' },
    });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: { name: 'a' } }));

    rerender({ path: '/b' });

    expect(result.current.state).toEqual({ status: 'loading' });
  });
});
