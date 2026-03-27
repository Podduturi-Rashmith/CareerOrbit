import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export type AppRole = 'student' | 'sub-admin' | 'admin'

/**
 * Returns the current user's role from Clerk session metadata.
 * Returns null if unauthenticated.
 */
export async function getCurrentRole(): Promise<AppRole | null> {
  const { sessionClaims } = await auth()
  if (!sessionClaims) return null
  const meta = sessionClaims.metadata as { role?: AppRole } | undefined
  return meta?.role ?? 'student'
}

/**
 * Returns the current userId from Clerk. Null if unauthenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Call at the top of an admin API route handler.
 * Returns a 401/403 NextResponse if the caller isn't admin/sub-admin, or null if allowed.
 */
export async function requireAdminRole(): Promise<NextResponse | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  if (role !== 'admin' && role !== 'sub-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/**
 * Call at the top of a student API route handler.
 * Returns a 401 NextResponse if not authenticated, or null if allowed.
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
