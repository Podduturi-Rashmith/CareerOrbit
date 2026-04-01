export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload.error as string) || 'Request failed.'
        : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}
