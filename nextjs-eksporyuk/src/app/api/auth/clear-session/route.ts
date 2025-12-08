import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Clear all session cookies
 * Visit: /api/auth/clear-session
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    // Delete all NextAuth related cookies
    const deletedCookies: string[] = []
    
    for (const cookie of allCookies) {
      if (cookie.name.includes('next-auth') || cookie.name.includes('__Secure-next-auth')) {
        cookieStore.delete(cookie.name)
        deletedCookies.push(cookie.name)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session cleared successfully',
      deletedCookies,
      instructions: {
        step1: 'Session cookies have been deleted',
        step2: 'Go to /login',
        step3: 'Login with: admin@eksporyuk.com / password123',
      }
    }, {
      headers: {
        'Clear-Site-Data': '"cookies"',
      }
    })
    
  } catch (error: any) {
    console.error('Clear session error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Manually clear cookies in browser DevTools'
    }, { status: 500 })
  }
}
