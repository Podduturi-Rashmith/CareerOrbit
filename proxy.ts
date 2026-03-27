import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// Admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

// Student routes (authenticated, any role)
const isStudentRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/applications(.*)',
  '/calendar(.*)',
  '/profile(.*)',
  '/api/student(.*)',
])

const isRootRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Redirect authenticated users away from root and auth pages to dashboard
  if (userId && isRootRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow public routes through for unauthenticated users
  if (isPublicRoute(req)) return NextResponse.next()

  // Require sign-in for all protected routes
  const { sessionClaims } = await auth()

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

  // Admin routes: require admin or sub-admin role
  if (isAdminRoute(req)) {
    if (role !== 'admin' && role !== 'sub-admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
