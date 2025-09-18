
type ErrorShape = { message: string, code?: string }

export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let err: ErrorShape = { message: 'Unknown error' };
    try { err = await res.json(); } catch { /* ignore */ }
    throw new Error(err.message || 'Ошибка');
  }
  try {
    return await res.json() as T;
  } catch {
    // allow endpoints that return empty body
    return undefined as unknown as T;
  }
}
