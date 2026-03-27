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

  const role = (sessionClaims?.metadata as Record<string, string> | undefined)?.role
  const path = req.nextUrl.pathname
  const isAdmin = role === 'admin' || role === 'sub-admin'
  const isExplicitStudent = role === 'student'

  // Admin hitting /dashboard → send to /admin
  if (path.startsWith('/dashboard') && isAdmin) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Only block /admin if we KNOW they're a student (not if role is missing/stale JWT)
  // If role is undefined, let the page handle it via useUser() which fetches fresh data
  if (path.startsWith('/admin') && isExplicitStudent) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
