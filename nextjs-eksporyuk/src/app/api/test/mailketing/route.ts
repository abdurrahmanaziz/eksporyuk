import { NextRequest, NextResponse } from 'next/server'
import { mailketingService } from '@/lib/mailketing'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(request: NextRequest) {
  // Require admin authentication
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { to, subject, body } = await request.json()

    if (!mailketingService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Mailketing not configured. Check MAILKETING_API_KEY in .env'
      })
    }

    const result = await mailketingService.sendEmail({
      to,
      subject,
      body
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
