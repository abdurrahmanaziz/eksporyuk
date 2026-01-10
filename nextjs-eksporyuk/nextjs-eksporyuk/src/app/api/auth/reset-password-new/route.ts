import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { mailketingService } from '@/lib/services/mailketingService'


export const dynamic = 'force-dynamic';
/**
 * POST /api/auth/reset-password
 * Reset password menggunakan token
 * Body: { token, newPassword }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    // Validasi input
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token dan password baru harus diisi' },
        { status: 400 }
      )
    }

    // Enhanced password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Strong password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          error: 'Password harus mengandung minimal: 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol (@$!%*?&)',
          hint: 'Contoh: Ekspor123!'
        },
        { status: 400 }
      )
    }

    // Cek token valid dan tidak expired
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date() // Belum expired
        }
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link reset password tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan email di token
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

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password user
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Mark token sebagai used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    })

    // Hapus semua token lama untuk email ini
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: resetToken.email,
        id: { not: resetToken.id }
      }
    })

    // Kirim email konfirmasi via Mailketing
    try {
      await mailketingService.sendPasswordResetConfirmationEmail({
        email: user.email,
        name: user.name
      })
      
      console.log('✅ Security notification email sent to:', user.email)
    } catch (emailError) {
      console.error('❌ Gagal kirim email konfirmasi reset:', emailError)
      // Jangan block response jika email gagal
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password berhasil direset. Silakan login dengan password baru'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error reset-password:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
