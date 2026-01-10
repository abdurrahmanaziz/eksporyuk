import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Security Middleware: Check if user is authenticated and has ADMIN role
 * 
 * Usage:
 * ```typescript
 * const authCheck = await requireAdmin()
 * if (authCheck.error) return authCheck.response
 * const session = authCheck.session
 * ```
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
  }

  if (session.user.role !== 'ADMIN') {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  return {
    error: false,
    session
  }
}

/**
 * Security Middleware: Check if user is authenticated (any role)
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
  }

  return {
    error: false,
    session
  }
}

/**
 * Security Middleware: Check if user has specific role(s)
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      error: true,
      response: NextResponse.json(
        { error: `Forbidden - Required role: ${allowedRoles.join(' or ')}` },
        { status: 403 }
      )
    }
  }

  return {
    error: false,
    session
  }
}
