import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email-verification'
import { verificationRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    console.log('🔐 Email verification request received')
    console.log('   Token:', token?.substring(0, 20) + '...')

    if (!token) {
      console.log('❌ No token provided')
      return NextResponse.json(
        { success: false, error: 'Token tidak ditemukan' },
        { status: 400 }
      )
    }

    // Rate limiting: 5 requests per 30 minutes per IP
    const clientIP = getClientIP(request)
    const rateLimitKey = `verify-email:${clientIP}`
    const rateLimit = await verificationRateLimiter.check(rateLimitKey)
    
    if (rateLimit.limited) {
      console.warn(`⚠️ Rate limit exceeded for verify-email from IP ${clientIP}`)
      return NextResponse.json(
        createRateLimitResponse(rateLimit.resetAt, rateLimit.current, 5),
        { status: 429 }
      )
    }

    console.log('🔍 Verifying token...')
    const result = await verifyEmailToken(token)

    if (!result.success) {
      console.log('❌ Verification failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    console.log('✅ Email verified successfully for user:', result.user?.email)
    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi!',
      user: result.user
    })
  } catch (error: any) {
    console.error('❌ Email verification error:', error)
    console.error('   Message:', error.message)
    console.error('   Stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
