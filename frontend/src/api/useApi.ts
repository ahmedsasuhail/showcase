import { useEffect, useState } from 'react';
import { ApiError, apiGet } from './client';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: T };

type Settled<T> = { key: string; state: Exclude<ApiState<T>, { status: 'loading' }> };

/**
 * Loads a GET endpoint and exposes loading / error / success, plus a retry.
 * A result only counts for the request that produced it, so changing the path
 * (e.g. moving between categories) never shows the previous page's data.
 */
export function useApi<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  // Identifies one request. A retry bumps `attempt`, so the key changes and the effect runs again;
  // a result stored under an older key is treated as stale and the hook reports "loading" instead.
  const key = `${attempt}:${path}`;

  useEffect(() => {
    const controller = new AbortController();
    apiGet<T>(path, controller.signal).then(
      (data) => setSettled({ key, state: { status: 'success', data } }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = error instanceof ApiError ? error : new ApiError(0, 'Unexpected error.');
        setSettled({ key, state: { status: 'error', error: apiError } });
      },
    );
    return () => controller.abort();
  }, [path, key]);

  const state: ApiState<T> = settled?.key === key ? settled.state : { status: 'loading' };
  return { state, retry: () => setAttempt((n) => n + 1) };
}
