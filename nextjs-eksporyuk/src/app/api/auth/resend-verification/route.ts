import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createVerificationToken, sendVerificationEmail } from '@/lib/email-verification'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('📧 [RESEND-VERIFICATION] Starting verification email resend...')
    
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('❌ [RESEND-VERIFICATION] No session found')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('👤 [RESEND-VERIFICATION] User ID:', session.user.id)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    })

    if (!user) {
      console.log('❌ [RESEND-VERIFICATION] User not found in database')
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      console.log('ℹ️ [RESEND-VERIFICATION] Email already verified')
      return NextResponse.json(
        { success: false, error: 'Email sudah terverifikasi' },
        { status: 400 }
      )
    }

    console.log('📧 [RESEND-VERIFICATION] Creating verification token for:', user.email)

    // Create verification token
    const token = await createVerificationToken(user.id, user.email)
    
    console.log('✅ [RESEND-VERIFICATION] Token created, sending email...')

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, token, user.name || 'User')
    
    if (!emailResult.success) {
      console.error('❌ [RESEND-VERIFICATION] Failed to send email:', emailResult.error)
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Gagal mengirim email verifikasi' },
        { status: 500 }
      )
    }

    console.log('✅ [RESEND-VERIFICATION] Email sent successfully via:', emailResult.provider)

    return NextResponse.json({
      success: true,
      message: 'Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.',
      provider: emailResult.provider
    })
  } catch (error: any) {
    console.error('❌ [RESEND-VERIFICATION] Error:', error?.message)
    console.error('   Stack:', error?.stack)
    
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' 
          ? error?.message || 'Terjadi kesalahan server'
          : 'Terjadi kesalahan server'
      },
      { status: 500 }
    )
  }
}
