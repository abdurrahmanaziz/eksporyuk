import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse, NextRequest } from 'next/server'

/**
 * Check if user has multiple dashboard options and needs selection
 * Admin goes straight to /admin - no selector needed
 */
function checkIfUserNeedsDashboardSelection(role: string, token: any): boolean {
  // Admin goes straight to admin panel - no selection needed
  if (role === 'ADMIN') return false
  
  // Check multi-role scenarios for non-admin users
  const hasAffiliateAccess = token.affiliateMenuEnabled && token.hasAffiliateProfile
  const hasMentorAccess = role === 'MENTOR'
  const hasMemberAccess = ['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR'].includes(role)
  
  let dashboardCount = 0
  if (hasMemberAccess) dashboardCount++
  if (hasAffiliateAccess || role === 'AFFILIATE') dashboardCount++
  if (hasMentorAccess) dashboardCount++
  
  return dashboardCount > 1
}

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
    const preferredDashboard = token.preferredDashboard as string | null

    // Redirect /dashboard based on role - with multi-role support
    if (pathname === '/dashboard') {
      // Check if user explicitly selected this dashboard (bypass selection)
      const selectedDashboard = request.nextUrl.searchParams.get('selected')
      
      // If user explicitly selected member dashboard, let them through
      if (selectedDashboard === 'member') {
        return NextResponse.next()
      }
      
      // Check if user needs dashboard selection
      const needsSelection = checkIfUserNeedsDashboardSelection(role, token)
      
      if (needsSelection) {
        // If user has a saved preference, auto-redirect to that dashboard
        if (preferredDashboard) {
          console.log('[MIDDLEWARE] User has saved preference:', preferredDashboard)
          switch (preferredDashboard) {
            case 'member':
              return NextResponse.next() // Stay on /dashboard
            case 'affiliate':
              return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
            case 'mentor':
              return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
            case 'admin':
              return NextResponse.redirect(new URL('/admin', request.url))
          }
        }
        
        // No saved preference - show selection page
        return NextResponse.redirect(new URL('/dashboard-selector', request.url))
      }
      
      // Auto-redirect single-role users
      switch (role) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin', request.url))
        case 'MENTOR':
          return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
        case 'AFFILIATE':
          return NextResponse.redirect(new URL('/affiliate/dashboard', request.url))
        case 'SUPPLIER':
          return NextResponse.redirect(new URL('/supplier/dashboard', request.url))
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

    if (pathname.startsWith('/mentor') && !['MENTOR', 'ADMIN'].includes(role)) {
      console.log('[MIDDLEWARE] Access denied: mentor route for non-mentor/admin')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/affiliate')) {
      // Allow ADMIN full access - check first
      if (role === 'ADMIN') {
        console.log('[MIDDLEWARE] Access granted: ADMIN has full access to affiliate')
        return NextResponse.next()
      }
      
      // Allow AFFILIATE role
      if (role === 'AFFILIATE') {
        console.log('[MIDDLEWARE] Access granted: AFFILIATE role')
        return NextResponse.next()
      }
      
      // Allow access if user has affiliate menu enabled (multi-role support)
      const hasAffiliateAccess = token.affiliateMenuEnabled && token.hasAffiliateProfile
      
      if (!hasAffiliateAccess) {
        console.log('[MIDDLEWARE] Access denied: affiliate route for non-affiliate without menu enabled')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      console.log('[MIDDLEWARE] Access granted: user has affiliate menu enabled')
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
    '/dashboard-selector',
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
