import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes through
  if (isPublic(req)) return

  const { userId, sessionClaims, redirectToSignIn } = await auth()

  // Not signed in — send to sign-in
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // Clerk role may be stored under different claim paths depending on your Clerk setup.
  // We try multiple candidates to avoid false "student" defaults.
  const sessionAny = sessionClaims as any
  const rawRole =
    sessionAny?.metadata?.role
    ?? sessionAny?.publicMetadata?.role
    ?? sessionAny?.claims?.metadata?.role
    ?? sessionAny?.claims?.role
    ?? sessionAny?.claims?.publicMetadata?.role
    ?? sessionAny?.claims?.public_metadata?.role
    ?? sessionAny?.claims?.public_metadata?.roles
    ?? undefined

  const rawRoleCandidates = {
    metadataRole: sessionAny?.metadata?.role,
    publicMetadataRole: sessionAny?.publicMetadata?.role,
    claimsMetadataRole: sessionAny?.claims?.metadata?.role,
    claimsRole: sessionAny?.claims?.role,
    claimsPublicMetadataRole: sessionAny?.claims?.publicMetadata?.role,
    claimsPublicMetadataSnakeRole: sessionAny?.claims?.public_metadata?.role,
  }
  const role = typeof rawRole === 'string' ? rawRole.toLowerCase() : rawRole
  const path = req.nextUrl.pathname
  const isAdmin = role === 'admin' || role === 'sub-admin'
  const isExplicitStudent = role === 'student'
  const isStudentRoute =
    path.startsWith('/dashboard')
    || path.startsWith('/applications')
    || path.startsWith('/calendar')
    || path.startsWith('/profile')
    || path.startsWith('/api/student')
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin')

  // Admin users are restricted to admin area only.
  if (isStudentRoute && isAdmin) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Student users are restricted to student area only.
  if (isAdminRoute && isExplicitStudent) {
    return NextResponse.redirect(new URL('/access-denied?reason=admin-only&returnUrl=%2Fdashboard', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
