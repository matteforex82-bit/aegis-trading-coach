import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/account',
  '/api/accounts',
  '/api/subscriptions',
  '/api/admin'
]

// Define admin routes
const adminRoutes = [
  '/admin',
  '/api/admin'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/complete-signup',
  '/auth/error',
  '/pricing',
  '/terms',
  '/privacy',
  '/api/auth',
  '/api/webhooks'
]

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users to signin
    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      // For now, allow any authenticated user to access admin routes
      // In production, you should check for admin role
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Check subscription status for protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      try {
        // Get user's subscription status
        const response = await fetch(new URL('/api/subscriptions', req.url), {
          headers: {
            'Authorization': `Bearer ${token.sub}`,
            'Cookie': req.headers.get('cookie') || ''
          }
        })

        if (response.ok) {
          const { subscription } = await response.json()
          
          // Allow access if user has active subscription or is in trial
          if (subscription && ['active', 'trialing'].includes(subscription.status)) {
            return NextResponse.next()
          }
          
          // Redirect to pricing if no active subscription
          if (pathname !== '/pricing') {
            const pricingUrl = new URL('/pricing', req.url)
            pricingUrl.searchParams.set('reason', 'subscription_required')
            return NextResponse.redirect(pricingUrl)
          }
        }
      } catch (error) {
        console.error('Middleware subscription check error:', error)
        // Allow access on error to prevent blocking legitimate users
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes without token
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Require token for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}