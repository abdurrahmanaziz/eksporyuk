import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Request PIN reset (send verification code to email)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store verification code in database
    await prisma.emailVerificationToken.create({
      data: {
        userId: session.user.id,
        token: verificationCode,
        expiresAt,
        type: 'PIN_RESET' // New type for PIN reset
      }
    })

    // Send email with verification code
    await sendEmail({
      to: user.email,
      subject: '🔒 Kode Reset PIN Withdrawal - EksporYuk',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Reset PIN Withdrawal</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Halo <strong>${user.name}</strong>,</p>
            
            <p style="margin-bottom: 20px;">Anda meminta untuk mereset PIN withdrawal. Gunakan kode verifikasi berikut:</p>
            
            <div style="background: white; border: 3px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">Kode berlaku selama 15 menit</p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Keamanan:</strong><br>
                • Jangan bagikan kode ini kepada siapapun<br>
                • Admin tidak akan pernah meminta kode verifikasi Anda<br>
                • Jika Anda tidak meminta reset PIN, abaikan email ini
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              Salam,<br>
              <strong>Tim EksporYuk</strong>
            </p>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda',
      expiresIn: 900 // 15 minutes in seconds
    })

  } catch (error) {
    console.error('Error requesting PIN reset:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim kode verifikasi' },
      { status: 500 }
    )
  }
}

// PUT - Verify code and reset PIN
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { verificationCode, newPin } = body

    // Validate inputs
    if (!verificationCode || !newPin) {
      return NextResponse.json(
        { error: 'Kode verifikasi dan PIN baru harus diisi' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      return NextResponse.json(
        { error: 'Kode verifikasi harus 6 digit angka' },
        { status: 400 }
      )
    }

    if (!/^\d+$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PIN hanya boleh berisi angka' },
        { status: 400 }
      )
    }

    // Get PIN length from settings
    const settings = await prisma.settings.findFirst()
    const pinLength = settings?.withdrawalPinLength || 6

    if (newPin.length !== pinLength) {
      return NextResponse.json(
        { error: `PIN harus ${pinLength} digit` },
        { status: 400 }
      )
    }

    // Verify the code
    const token = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: session.user.id,
        token: verificationCode,
        type: 'PIN_RESET',
        expiresAt: { gt: new Date() }
      }
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Kode verifikasi salah atau sudah kadaluarsa' },
        { status: 400 }
      )
    }

    // Hash the new PIN
    const hashedPin = await bcrypt.hash(newPin, 10)

    // Update user's PIN
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        withdrawalPin: hashedPin,
        withdrawalPinSetAt: new Date()
      }
    })

    // Delete used verification token
    await prisma.emailVerificationToken.delete({
      where: { id: token.id }
    })

    // Delete all other unused tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: session.user.id,
        type: 'PIN_RESET'
      }
    })

    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    })

    // Send confirmation email
    if (user) {
      await sendEmail({
        to: user.email,
        subject: '✅ PIN Withdrawal Berhasil Direset - EksporYuk',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ PIN Berhasil Direset</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Halo <strong>${user.name}</strong>,</p>
              
              <p style="margin-bottom: 20px;">PIN withdrawal Anda telah berhasil direset pada:</p>
              
              <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>📅 Tanggal:</strong> ${new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <p style="margin-bottom: 20px;">Sekarang Anda dapat menggunakan PIN baru untuk melakukan penarikan dana.</p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Jika Anda tidak melakukan perubahan ini:</strong><br>
                  Segera hubungi tim support kami untuk mengamankan akun Anda.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                Salam,<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </div>
          </body>
          </html>
        `
      })
    }

    return NextResponse.json({
      success: true,
      message: 'PIN berhasil direset'
    })

  } catch (error) {
    console.error('Error resetting PIN:', error)
    return NextResponse.json(
      { error: 'Gagal mereset PIN' },
      { status: 500 }
    )
  }
}
