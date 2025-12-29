import { prisma } from './prisma'
import crypto from 'crypto'
import { renderBrandedTemplateBySlug, type TemplateData } from './branded-template-engine'
import { mailketing } from './integrations/mailketing'

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Create verification token in database
export async function createVerificationToken(userId: string, email: string) {
  const token = generateVerificationToken()
  const expires = new Date()
  expires.setHours(expires.getHours() + 24) // Token valid for 24 hours

  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { identifier: userId }
  })

  // Create new token
  await prisma.emailVerificationToken.create({
    data: {
      identifier: userId,
      token,
      expires,
      type: 'EMAIL_VERIFY',
      metadata: JSON.stringify({ email })
    }
  })

  return token
}

// Verify email with token
export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token }
  })

  if (!verificationToken) {
    return { success: false, error: 'Token tidak valid' }
  }

  // Check if token expired
  if (new Date() > verificationToken.expires) {
    return { success: false, error: 'Token sudah kadaluarsa. Silakan minta token baru.' }
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: verificationToken.identifier }
  })

  if (!user) {
    return { success: false, error: 'User tidak ditemukan' }
  }

  // Update user email verification status
  await prisma.user.update({
    where: { id: verificationToken.identifier },
    data: { emailVerified: true }
  })

  // Delete the used token
  await prisma.emailVerificationToken.delete({
    where: { token }
  })

  return { 
    success: true, 
    user 
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string, name: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`
  
  console.log('📧 Preparing verification email...')
  console.log('   Email:', email)
  console.log('   Name:', name)
  console.log('   URL:', verificationUrl)
  
  try {
    // Check if Mailketing is configured (from DB or env)
    const mailketingConfigured = !!process.env.MAILKETING_API_KEY
    console.log('   Mailketing configured:', mailketingConfigured)
    
    // Try branded template first
    try {
      const templateData: TemplateData = {
        name,
        email,
        verification_url: verificationUrl,
        site_name: 'EksporYuk',
        site_url: baseUrl,
        login_link: `${baseUrl}/login`,
        dashboard_link: `${baseUrl}/dashboard`,
      }

      const renderedEmail = await renderBrandedTemplateBySlug('email-verification', templateData, {
        fallbackSubject: 'Verifikasi Email Anda - EksporYuk',
        fallbackContent: [
          'Halo {name},',
          '',
          'Terima kasih telah mendaftar di EksporYuk.',
          'Silakan verifikasi email Anda dengan klik tombol di bawah ini:',
          '',
          'Jika tombol tidak bisa diklik, salin link berikut ke browser:',
          '{verification_url}',
          '',
          'Jika Anda tidak merasa mendaftar atau meminta perubahan ini, abaikan email ini.',
          '',
          'Salam hangat,',
          'Tim EksporYuk'
        ].join('\n'),
        fallbackCtaText: 'Verifikasi Email Sekarang',
        fallbackCtaLink: '{verification_url}',
      })

      if (renderedEmail) {
        const result = await mailketing.sendEmail({
          to: email,
          subject: renderedEmail.subject,
          html: renderedEmail.html,
          text: renderedEmail.text,
          tags: ['verification', 'onboarding']
        })

        if (result.success) {
          console.log('✅ Verification email sent via branded template to:', email)
          return { success: true, provider: 'mailketing', template: renderedEmail.templateName }
        }
      }
    } catch (templateError: any) {
      console.warn('⚠️ Branded template error (will try fallback):', templateError?.message)
    }

    // Fallback to hardcoded template if branded template failed
    console.log('⚠️ Branded template unavailable, using fallback')
    const { sendVerificationEmail: sendMail } = await import('./integrations/mailketing')
    const result = await sendMail(email, name, verificationUrl)
    
    if (result.success) {
      console.log('✅ Verification email sent via fallback to:', email)
      return { success: true, provider: 'mailketing', template: 'fallback' }
    }
    
    // Dev mode fallback
    if (!process.env.MAILKETING_API_KEY) {
      console.log('💡 DEV MODE: Email would be sent to:', email)
      console.log('📧 Verification URL:', verificationUrl)
      return { success: true, devMode: true, provider: 'console' }
    }
    
    return { success: false, error: 'Failed to send email' }
    
  } catch (error: any) {
    console.error('❌ Email service error:', error.message)
    console.error('   Stack:', error.stack)
    
    // Fallback: Log to console in dev mode
    if (!process.env.MAILKETING_API_KEY) {
      console.log('=== EMAIL VERIFIKASI (FALLBACK) ===')
      console.log('To:', email)
      console.log('Name:', name)
      console.log('Verification URL:', verificationUrl)
      console.log('===================================')
      return { success: true, devMode: true, provider: 'console' }
    }
    
    return { success: false, error: error.message }
  }
}

// Validate Gmail email
export function isValidGmailEmail(email: string): boolean {
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
  return gmailRegex.test(email)
}

// Check if user has verified email
export async function checkEmailVerification(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true }
  })

  return user?.emailVerified || false
}

// Resend verification email
export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return { success: false, error: 'User tidak ditemukan' }
  }

  if (user.emailVerified) {
    return { success: false, error: 'Email sudah terverifikasi' }
  }

  const token = await createVerificationToken(user.id, user.email)
  await sendVerificationEmail(user.email, token, user.name)

  return { success: true }
}
