import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse, NextRequest } from 'next/server'

// Handle /login redirect before auth middleware
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Redirect /login to /auth/login
  if (pathname === '/login') {
    const authLoginUrl = new URL('/auth/login', request.url)
    // Preserve query params (like callbackUrl)
    request.nextUrl.searchParams.forEach((value, key) => {
      authLoginUrl.searchParams.set(key, value)
    })
    return NextResponse.redirect(authLoginUrl)
  }

  // Fix CSS loading for Vercel
  if (pathname.startsWith('/_next/static/') || pathname.includes('.css')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    response.headers.set('Content-Type', pathname.includes('.css') ? 'text/css' : 'application/javascript')
    return response
  }

  // Continue with auth middleware for protected routes
  return authMiddleware(request as NextRequestWithAuth)
}

const authMiddleware = withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl
    const token = request.nextauth.token

    console.log('[MIDDLEWARE] Path:', pathname, 'Token exists:', !!token, 'Role:', token?.role)

    // Redirect unauthenticated users
    if (!token) {
      console.log('[MIDDLEWARE] No token, redirecting to login')
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = token.role as string

    // Redirect /dashboard based on role - direct to primary dashboard
    if (pathname === '/dashboard') {
      // Auto-redirect based on primary role - RoleSwitcher available in sidebar for multi-role users
      switch (role) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin', request.url))
        case 'SUPPLIER':
          return NextResponse.redirect(new URL('/supplier/dashboard', request.url))
        case 'MENTOR':
          return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
        case 'AFFILIATE':
          return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
        default:
          // MEMBER_PREMIUM & MEMBER_FREE stay on /dashboard
          return NextResponse.next()
      }
    }

    // Role-based access control
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      console.log('[MIDDLEWARE] Access denied: admin route for non-admin')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/mentor')) {
      // Check if user has MENTOR role (primary or additional) OR is ADMIN
      const allRoles = token.allRoles as string[] || [role]
      const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
      
      if (!hasMentorAccess) {
        console.log('[MIDDLEWARE] Access denied: mentor route for non-mentor/admin. User roles:', allRoles)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      console.log('[MIDDLEWARE] Mentor access granted. User roles:', allRoles)
    }

    if (pathname.startsWith('/affiliate')) {
      // Allow ADMIN full access - check first
      if (role === 'ADMIN') {
        console.log('[MIDDLEWARE] Access granted: ADMIN has full access to affiliate')
        return NextResponse.next()
      }
      
      // For all other roles, check if user has active affiliate profile
      // This applies to any role: MEMBER_FREE, MEMBER_PREMIUM, MENTOR, etc
      const hasActiveAffiliateProfile = token.hasAffiliateProfile
      
      if (!hasActiveAffiliateProfile) {
        console.log('[MIDDLEWARE] Access denied: no active affiliate profile')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      console.log('[MIDDLEWARE] Access granted: user has active affiliate profile')
    }

    if (pathname.startsWith('/supplier') && !['SUPPLIER', 'ADMIN'].includes(role)) {
      console.log('[MIDDLEWARE] Access denied: supplier route for non-supplier/admin')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // ========================================
    // MEMBER_FREE RESTRICTIONS
    // ========================================
    if (role === 'MEMBER_FREE') {
      // Allowed paths for FREE users
      const allowedPaths = [
        '/dashboard',
        '/dashboard/complete-profile',
        '/dashboard/upgrade',
        '/dashboard/my-membership',
        '/checkout',
        '/profile',
        '/auth',
        '/api/member/onboarding',
        '/api/upload',
        '/api/user',
        '/notifications',
      ]

      const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path))

      if (!isAllowedPath) {
        console.log('[MIDDLEWARE] MEMBER_FREE blocked from:', pathname)
        const upgradeUrl = new URL('/dashboard/upgrade', request.url)
        upgradeUrl.searchParams.set('reason', 'premium-required')
        upgradeUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(upgradeUrl)
      }
    }

    console.log('[MIDDLEWARE] Access granted')
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // CRITICAL: Return true only if token exists
        // This callback determines if middleware function runs
        const hasToken = !!token
        console.log('[MIDDLEWARE] Authorized callback - Has token:', hasToken)
        return hasToken
      },
    },
  }
)

export const config = {
  matcher: [
    '/login', // Handle /login redirect
    '/dashboard/:path*',
    '/admin/:path*',
    '/mentor/:path*',
    '/affiliate/:path*',
    '/community/:path*',
    '/databases/:path*',
    '/documents/:path*',
    '/courses/:path*',
    '/learn/:path*',
    '/chat/:path*',
    '/my-events/:path*',
    '/member-directory/:path*',
    '/saved-posts/:path*',
    '/certificates/:path*',
    '/supplier/:path*',
    '/api/protected/:path*'
  ],
}
