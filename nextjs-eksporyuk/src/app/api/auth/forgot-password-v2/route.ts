import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { mailketingService } from '@/lib/services/mailketingService'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic';
/**
 * POST /api/auth/forgot-password-v2
 * Request password reset - generates token and sends email via Mailketing
 * Uses new PasswordResetToken model with Mailketing integration
 * 
 * PUT /api/auth/forgot-password-v2
 * Reset password with valid token
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

    // Build reset link - use dynamic app URL with query parameter
    // CRITICAL: Trim to remove any whitespace/newlines from env vars
    const appUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`

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

/**
 * PUT /api/auth/forgot-password-v2
 * Reset password with valid token
 * Expects: { token: string, newPassword: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token harus diisi' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Password baru harus diisi' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link reset password tidak valid' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token }
      })

      return NextResponse.json(
        { error: 'Link reset password sudah kadaluarsa. Silakan minta link baru.' },
        { status: 400 }
      )
    }

    // Check if token already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Link reset password sudah digunakan. Silakan minta link baru.' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    })

    // Delete all other unused tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: resetToken.email,
        token: { not: token },
        used: false
      }
    })

    // Send confirmation email
    try {
      await mailketingService.sendPasswordResetConfirmationEmail({
        email: user.email,
        name: user.name || user.email
      })
    } catch (emailError) {
      console.error('[RESET_PASSWORD] Confirmation email error:', emailError)
      // Don't fail the request if confirmation email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru'
    })

  } catch (error) {
    console.error('[RESET_PASSWORD_V2] Error:', error)

    return NextResponse.json(
      { error: 'Gagal mereset password' },
      { status: 500 }
    )
  }
}
