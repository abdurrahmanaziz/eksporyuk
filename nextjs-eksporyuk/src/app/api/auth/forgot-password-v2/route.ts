import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { mailketingService } from '@/lib/services/mailketingService'

/**
 * POST /api/auth/forgot-password-v2
 * Request password reset - generates token and sends email via Mailketing
 * Uses new PasswordResetToken model with Mailketing integration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    })

    // Always return success to prevent email enumeration attacks
    // This is a security best practice - don't reveal if email exists or not
    const successResponse = {
      success: true,
      message: 'Jika email terdaftar, link reset password telah dikirim. Cek inbox atau folder spam Anda.'
    }

    // If user doesn't exist, still return success but don't generate token
    if (!user) {
      return NextResponse.json(successResponse)
    }

    // If user exists but not active, still allow reset
    // This helps reactivate accounts

    // Delete any existing tokens for this email (cleanup)
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    })

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
        used: false
      }
    })

    // Build reset link - use dynamic app URL
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password/${token}`

    // Send email via Mailketing with new template
    try {
      await mailketingService.sendPasswordResetEmail({
        email: user.email,
        name: user.name || user.email,
        resetLink
      })
    } catch (emailError) {
      // Log error but don't fail the request - email service might be down
      console.error('[FORGOT_PASSWORD] Email send error:', emailError)
    }

    return NextResponse.json(successResponse)
  } catch (error) {
    console.error('[FORGOT_PASSWORD] Error:', error)

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses permintaan' },
      { status: 500 }
    )
  }
}
