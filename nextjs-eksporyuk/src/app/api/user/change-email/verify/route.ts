import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { token, code } = await request.json()

    // Validasi input
    if (!token || !code) {
      return NextResponse.json(
        { error: 'Token dan kode verifikasi harus diisi' },
        { status: 400 }
      )
    }

    // Validasi kode harus 6 digit
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: 'Kode verifikasi harus 6 digit angka' },
        { status: 400 }
      )
    }

    // Get verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Cek apakah token sudah kadaluarsa
    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.json(
        { error: 'Kode verifikasi sudah kadaluarsa. Silakan request ulang.' },
        { status: 400 }
      )
    }

    // Cek apakah identifier cocok dengan current user email
    if (verificationToken.identifier !== session.user.email) {
      return NextResponse.json(
        { error: 'Token tidak valid untuk user ini' },
        { status: 400 }
      )
    }

    // Parse metadata
    const metadata = JSON.parse(verificationToken.metadata || '{}')
    const { newEmail, code: savedCode } = metadata

    // Verify code
    if (code !== savedCode) {
      return NextResponse.json(
        { error: 'Kode verifikasi salah' },
        { status: 400 }
      )
    }

    // Cek lagi apakah email sudah digunakan (double check)
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser) {
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.json(
        { error: 'Email sudah digunakan oleh akun lain' },
        { status: 400 }
      )
    }

    const oldEmail = session.user.email

    // Update email user
    await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail }
    })

    // Delete verification token
    await prisma.emailVerificationToken.delete({
      where: { token }
    })

    // Send notification to OLD email
    const notificationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✓ Email Berhasil Diubah</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Halo,
              </p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
                Email akun Anda telah berhasil diubah.
              </p>
              
              <!-- Info -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <div style="margin-bottom: 15px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Email Lama:</div>
                  <div style="font-size: 16px; color: #333; font-weight: bold;">${oldEmail}</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Email Baru:</div>
                  <div style="font-size: 16px; color: #22c55e; font-weight: bold;">${newEmail}</div>
                </div>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Mulai sekarang, gunakan email baru Anda (<strong>${newEmail}</strong>) untuk login.
              </p>
              
              <!-- Warning -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ <strong>Perhatian:</strong> Jika Anda tidak melakukan perubahan ini, segera hubungi tim support kami untuk mengamankan akun Anda.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Terima kasih,<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Email ini dikirim otomatis, mohon tidak membalas email ini.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send to old email (informasi)
    await sendEmail({
      to: oldEmail,
      subject: 'Notifikasi: Email Akun Anda Telah Diubah - EksporYuk',
      html: notificationHtml
    })

    // Send confirmation to new email
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Selamat Datang!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Halo,
              </p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
                Email Anda telah berhasil terdaftar sebagai email utama akun EksporYuk.
              </p>
              
              <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
                <div style="font-size: 18px; color: #16a34a; font-weight: bold;">Email Berhasil Diubah</div>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Mulai sekarang, gunakan email ini untuk login dan menerima notifikasi dari EksporYuk.
              </p>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Terima kasih,<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Email ini dikirim otomatis, mohon tidak membalas email ini.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    await sendEmail({
      to: newEmail,
      subject: 'Selamat! Email Akun Anda Telah Diubah - EksporYuk',
      html: confirmationHtml
    })

    return NextResponse.json({
      success: true,
      newEmail,
      message: 'Email berhasil diubah'
    })
  } catch (error) {
    console.error('Verify email change error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memverifikasi email' },
      { status: 500 }
    )
  }
}
