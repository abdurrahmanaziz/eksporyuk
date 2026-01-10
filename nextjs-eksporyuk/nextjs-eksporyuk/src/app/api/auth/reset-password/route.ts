import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/**
 * DEPRECATED API - Please use /api/auth/reset-password-new
 * This endpoint is kept for backward compatibility but will be removed in future versions.
 * 
 * @deprecated Use /api/auth/reset-password-new instead
 */
export async function POST(request: NextRequest) {
  console.warn('⚠️ DEPRECATED: /api/auth/reset-password called. Use /api/auth/reset-password-new instead');
  
  // Forward to new API
  try {
    const body = await request.json()
    
    // Call the new endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/reset-password-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'X-Deprecated-API': 'true',
        'X-New-Endpoint': '/api/auth/reset-password-new'
      }
    })

    // Cek token valid dan tidak expired
    const resetToken = await prisma.emailVerificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET'
      }
    })

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Link reset password tidak valid atau sudah kadaluarsa. Mohon minta link baru.' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan identifier (user ID) di token
    const user = await prisma.user.findUnique({
      where: { id: resetToken.identifier },
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

    // Update password user di database
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        isActive: true // Aktifkan kembali akun jika sebelumnya tidak aktif
      }
    })

    // Hapus token setelah digunakan
    await prisma.emailVerificationToken.delete({
      where: { id: resetToken.id }
    })

    // Kirim email konfirmasi
    try {
      await mailketingService.sendPasswordResetConfirmationEmail({
        email: user.email,
        name: user.name || user.email
      })
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
