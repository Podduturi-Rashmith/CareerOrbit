import { NextResponse } from 'next/server';

export async function parseJsonObject(
  request: Request
): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return null;
  }
  return body as Record<string, unknown>;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function looksLikeMongoOrTlsFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: string; message?: string; code?: string };
  const name = candidate.name || '';
  const message = candidate.message || '';
  const code = candidate.code || '';
  return (
    /mongo/i.test(name) ||
    /mongo/i.test(message) ||
    /SSL|TLS|server selection/i.test(message) ||
    /ERR_SSL|ECONN|ETIMEDOUT/i.test(code)
  );
}

export function serverErrorResponse(
  error: unknown,
  fallbackMessage = 'Internal server error.'
) {
  if (looksLikeMongoOrTlsFailure(error)) {
    return jsonError(
      'Database connectivity issue. Please retry in a few seconds and verify MongoDB network/TLS settings.',
      503
    );
  }
  return jsonError(fallbackMessage, 500);
}
