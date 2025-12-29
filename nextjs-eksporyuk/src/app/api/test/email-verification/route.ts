import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email-verification'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Test endpoint untuk verifikasi email
 * GET /api/test/email-verification?email=test@gmail.com&name=Test User
 */
export async function GET(request: NextRequest) {
  // Require admin authentication
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'test@gmail.com'
    const name = searchParams.get('name') || 'Test User'
    const token = 'test-token-' + Date.now()

    console.log('🧪 Testing email verification...')
    console.log('   Email:', email)
    console.log('   Name:', name)
    console.log('   Token:', token)

    const result = await sendVerificationEmail(email, token, name)

    return NextResponse.json({
      success: true,
      message: 'Email verification test completed',
      result,
      mailketingConfigured: !!process.env.MAILKETING_API_KEY,
      env: {
        MAILKETING_API_KEY: process.env.MAILKETING_API_KEY ? 'SET' : 'NOT SET',
        MAILKETING_FROM_EMAIL: process.env.MAILKETING_FROM_EMAIL || 'not set',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set'
      }
    })

  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
