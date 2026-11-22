export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Per-field problems, when the API rejected the request as invalid (400). */
    readonly details: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** GET a path under the relative /api. The browser never talks to any other origin. */
export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { headers: { Accept: 'application/json' }, signal });
}

/** POST JSON to a path under the relative /api. */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(0, 'Could not reach the server.');
  }
  if (!response.ok) {
    const { message, details } = await readError(response);
    throw new ApiError(response.status, message, details);
  }
  return (await response.json()) as T;
}

async function readError(response: Response): Promise<{ message: string; details: FieldError[] }> {
  const fallback = `Request failed (${response.status}).`;
  try {
    const body = (await response.json()) as { error?: { message?: unknown; details?: unknown } };
    const message = typeof body.error?.message === 'string' ? body.error.message : fallback;
    const details = Array.isArray(body.error?.details) ? (body.error.details as FieldError[]) : [];
    return { message, details };
  } catch {
    return { message: fallback, details: [] };
  }
}
