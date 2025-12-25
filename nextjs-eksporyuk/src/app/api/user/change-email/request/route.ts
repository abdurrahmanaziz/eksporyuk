import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { newEmail } = await request.json()

    // Validasi input
    if (!newEmail) {
      return NextResponse.json(
        { error: 'Email baru harus diisi' },
        { status: 400 }
      )
    }

    // Validasi email harus gmail.com
    if (!newEmail.endsWith('@gmail.com')) {
      return NextResponse.json(
        { error: 'Email baru harus menggunakan Gmail (@gmail.com)' },
        { status: 400 }
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@gmail\.com$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Cek apakah email baru sama dengan email lama
    if (newEmail === session.user.email) {
      return NextResponse.json(
        { error: 'Email baru tidak boleh sama dengan email saat ini' },
        { status: 400 }
      )
    }

    // Cek apakah email sudah digunakan user lain
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah digunakan oleh akun lain' },
        { status: 400 }
      )
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Save verification token (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Delete old email verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: {
        identifier: session.user.email,
        type: 'EMAIL_CHANGE'
      }
    })

    // Create new verification token
    await prisma.emailVerificationToken.create({
      data: {
        identifier: session.user.email, // Current email
        token: token,
        expires: expiresAt,
        type: 'EMAIL_CHANGE',
        metadata: JSON.stringify({
          newEmail,
          code,
        })
      }
    })

    // Send verification email to NEW email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verifikasi Email Baru</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Halo,
              </p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
                Anda telah meminta untuk mengubah email akun Anda. Gunakan kode verifikasi berikut untuk melanjutkan:
              </p>
              
              <!-- Verification Code -->
              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Kode Verifikasi</div>
                <div style="font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Kode ini akan kadaluarsa dalam <strong>15 menit</strong>.
              </p>
              
              <!-- Warning -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ <strong>Perhatian:</strong> Jika Anda tidak meminta perubahan email ini, abaikan email ini atau hubungi tim support kami.
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

    await sendEmail({
      to: newEmail,
      subject: 'Verifikasi Email Baru - EksporYuk',
      html: emailHtml
    })

    return NextResponse.json({
      success: true,
      token,
      message: 'Kode verifikasi telah dikirim ke email baru Anda'
    })
  } catch (error) {
    console.error('Request email change error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim kode verifikasi' },
      { status: 500 }
    )
  }
}
