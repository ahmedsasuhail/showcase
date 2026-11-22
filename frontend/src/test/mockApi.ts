import { vi } from 'vitest';

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Handler = () => Response | Promise<Response>;

/**
 * Replaces fetch for a test. Only relative /api URLs are allowed; anything else
 * (including any attempt to reach Fake Store) fails the test.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!url.startsWith('/api/')) throw new Error(`Blocked non-API request: ${url}`);
    const handler = routes[url];
    if (!handler) throw new Error(`Unmocked API request: ${url}`);
    return handler();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
