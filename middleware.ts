import { NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

// Protect all app pages (e.g. /dashboard) for signed-in users only.
// Keep the landing page + auth pages public.
export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname
  const allowlist = ['/', '/sign-in', '/sign-up']

  // Allow unauthenticated access to the public pages and API routes.
  if (allowlist.includes(pathname) || pathname.startsWith('/api')) {
    return
  }

  // Protect everything else. If not signed in, the user will be redirected to /sign-in.
  await auth.protect()
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Protect everything except Next.js internals, static assets, and the public landing/auth pages.
    '/((?!_next|favicon\.ico|sign-in|sign-up|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
