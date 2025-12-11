import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { resendVerificationEmail } from '@/lib/email-verification'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await resendVerificationEmail(session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.'
    })
  } catch (error: any) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
