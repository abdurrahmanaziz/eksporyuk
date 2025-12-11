import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createVerificationToken, sendVerificationEmail, isValidGmailEmail } from '@/lib/email-verification'
import { mailketing } from '@/lib/integrations/mailketing'
import { getNextMemberCode } from '@/lib/member-code'


export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, username, phone, whatsapp } = body

    console.log('[Register] Received data:', { email, name, hasPassword: !!password, phone, whatsapp })

    // Validate required fields
    if (!email || !name || !password) {
      console.log('[Register] Validation failed: missing required fields')
      return NextResponse.json(
        { success: false, error: 'Email, name, dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Use whatsapp if provided, otherwise use phone
    const userWhatsapp = whatsapp || phone || null

    // Validate Gmail email
    if (!isValidGmailEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email harus menggunakan Gmail (@gmail.com)' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: 'Username sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Generate username if not provided
    const finalUsername = username || name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 20) + '_' + Date.now().toString().slice(-6)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate member code
    const memberCode = await getNextMemberCode()

    // Create user with wallet
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        username: finalUsername,
        whatsapp: userWhatsapp,
        role: 'MEMBER_FREE',
        emailVerified: false, // Set to false initially
        memberCode, // Auto-generated EY0001, EY0002, dst
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        whatsapp: true,
        role: true,
        emailVerified: true,
        memberCode: true,
        createdAt: true,
      },
    })

    // Create verification token and send email
    try {
      const token = await createVerificationToken(user.id, email)
      await sendVerificationEmail(email, token, name)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails
    }

    // Send welcome email via Mailketing
    try {
      await mailketing.sendEmail({
        to: email,
        subject: 'Selamat Datang di EksporYuk!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Selamat Datang!</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Halo <strong>${name}</strong>,</p>
              <p style="font-size: 16px;">Terima kasih telah bergabung dengan EksporYuk!</p>
              <p style="font-size: 16px;">Akun Anda telah berhasil dibuat. Berikut adalah langkah selanjutnya:</p>
              <ul style="font-size: 14px; color: #4b5563;">
                <li>Verifikasi email Anda (cek email verifikasi)</li>
                <li>Lengkapi profil Anda</li>
                <li>Pilih membership yang sesuai dengan kebutuhan</li>
                <li>Mulai belajar ekspor!</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/dashboard" 
                   style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Kunjungi Dashboard
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">Jika ada pertanyaan, hubungi kami via WhatsApp atau email.</p>
              <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
            </div>
          </div>
        `,
        tags: ['welcome', 'registration']
      })
      console.log('[Register] Welcome email sent to:', email)
    } catch (welcomeEmailError) {
      console.error('Failed to send welcome email:', welcomeEmailError)
      // Don't fail registration if welcome email fails
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'USER',
        entityId: user.id,
      },
    })

    return NextResponse.json(
      { 
        message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
        user 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
