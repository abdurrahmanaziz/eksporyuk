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
    let memberCode
    try {
      memberCode = await getNextMemberCode()
      console.log('[Register] Generated member code:', memberCode)
    } catch (codeError) {
      console.error('[Register] Failed to generate member code:', codeError)
      // Continue without member code - can be generated later
      memberCode = null
    }

    // Create user with wallet
    let user
    try {
      console.log('[Register] Creating user with data:', {
        email,
        name,
        username: finalUsername,
        hasPassword: !!hashedPassword,
        passwordLength: hashedPassword?.length,
        whatsapp: userWhatsapp,
        memberCode,
      })
      
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          username: finalUsername,
          whatsapp: userWhatsapp,
          role: 'MEMBER_FREE',
          emailVerified: false, // Set to false initially
          isActive: true,  // CRITICAL: Set active by default
          isSuspended: false,  // CRITICAL: Not suspended by default
          memberCode, // Auto-generated EY0001, EY0002, dst (or null if failed)
          wallet: {
            create: {
              balance: 0,
              balancePending: 0,
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
          isActive: true,
          isSuspended: true,
          createdAt: true,
        },
      })
      console.log('[Register] User created successfully:', {
        id: user.id,
        email: user.email,
        username: user.username,
        memberCode: user.memberCode,
        isActive: user.isActive,
        isSuspended: user.isSuspended
      })
    } catch (createError: any) {
      console.error('[Register] Prisma create error:', createError)
      
      // Handle specific Prisma errors
      if (createError.code === 'P2002') {
        const field = createError.meta?.target?.[0] || 'field'
        return NextResponse.json(
          { success: false, error: `${field === 'email' ? 'Email' : field === 'username' ? 'Username' : 'Data'} sudah terdaftar` },
          { status: 400 }
        )
      }
      
      throw createError
    }

    // Create verification token and send email
    try {
      const token = await createVerificationToken(user.id, email)
      await sendVerificationEmail(email, token, name)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails
    }

    // Send welcome email using branded template
    try {
      console.log('[Register] 📧 Sending welcome email to:', email)
      const { renderBrandedTemplateBySlug } = await import('@/lib/branded-template-engine')
      const registrationDate = user.createdAt.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const emailTemplate = await renderBrandedTemplateBySlug('welcome-registration', {
        name: name,
        email: email,
        registration_date: registrationDate,
        role: 'Member Free',
        support_email: 'support@eksporyuk.com',
        support_phone: '+62 812-3456-7890',
        dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'}/dashboard`
      })

      if (emailTemplate) {
        await mailketing.sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          tags: ['welcome', 'registration', 'onboarding']
        })
        console.log('[Register] ✅ Welcome email sent successfully to:', email)
      } else {
        console.warn('[Register] ⚠️ Welcome template not found, skipping email')
      }
    } catch (welcomeEmailError) {
      console.error('[Register] ⚠️ Failed to send welcome email:', welcomeEmailError)
      // Don't fail registration if welcome email fails
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entity: 'USER',
          entityId: user.id,
        },
      })
    } catch (logError) {
      console.error('[Register] Failed to create activity log:', logError)
      // Don't fail registration if activity log fails
    }

    console.log('[Register] Registration successful for:', email)
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
        user 
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Register] Registration error:', error)
    console.error('[Register] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 3)
    })
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Terjadi kesalahan server. Silakan coba lagi.' 
      },
      { status: 500 }
    )
  }
}
