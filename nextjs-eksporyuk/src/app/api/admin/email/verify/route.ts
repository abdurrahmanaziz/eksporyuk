import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { verifyEmailService } from '@/lib/email-service'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/email/verify
 * Verify email service configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await verifyEmailService()

    return NextResponse.json({
      ...result,
      smtpHost: process.env.SMTP_HOST || 'Not configured',
      smtpPort: process.env.SMTP_PORT || 'Not configured',
      smtpUser: process.env.SMTP_USER || 'Not configured',
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    })

  } catch (error) {
    console.error('[Email Verify API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email service' },
      { status: 500 }
    )
  }
}
