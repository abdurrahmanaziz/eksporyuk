import { prisma } from './prisma'
import crypto from 'crypto'
import { renderBrandedTemplateBySlug, type TemplateData } from './branded-template-engine'
import { mailketing } from './integrations/mailketing'

// Generate random ID
function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
}

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

  // Create new token with generated id
  await prisma.emailVerificationToken.create({
    data: {
      id: generateId(), // IMPORTANT: Schema requires explicit id
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
  // CRITICAL: .trim() to remove any whitespace/newlines from env vars
  const baseUrl = (process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000').trim()
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`
  
  console.log('📧 Preparing verification email...')
  console.log('   Email:', email)
  console.log('   Name:', name)
  console.log('   Token:', token)
  console.log('   URL:', verificationUrl)
  
  try {
    // Check if Mailketing is configured
    const mailketingConfigured = !!process.env.MAILKETING_API_KEY
    console.log('   Mailketing API configured:', mailketingConfigured)
    
    // Try branded template first (priority 1)
    try {
      console.log('   Trying branded template: email-verification')
      
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
        fallbackSubject: '✅ Verifikasi Email Anda - EksporYuk',
        fallbackContent: [
          'Halo {name},',
          '',
          'Terima kasih telah mendaftar di EksporYuk!',
          '',
          'Untuk mengaktifkan akun Anda, mohon verifikasi alamat email dengan klik tombol di bawah ini:',
          '',
          'Jika tombol tidak bisa diklik, salin link berikut ke browser:',
          '{verification_url}',
          '',
          'Link verifikasi akan kadaluarsa dalam 24 jam.',
          '',
          'Jika Anda tidak merasa mendaftar, abaikan email ini.',
          '',
          'Salam,',
          'Tim EksporYuk'
        ].join('\n'),
        fallbackCtaText: 'Verifikasi Email',
        fallbackCtaLink: '{verification_url}',
      })

      if (renderedEmail) {
        console.log('   ✅ Template rendered:', renderedEmail.templateName)
        console.log('   Subject:', renderedEmail.subject)
        
        // Send via Mailketing API
        const result = await mailketing.sendEmail({
          to: email,
          subject: renderedEmail.subject,
          html: renderedEmail.html,
          text: renderedEmail.text,
          tags: ['verification', 'onboarding', 'email-verification']
        })

        if (result.success) {
          console.log('✅ Verification email sent via branded template')
          console.log('   Provider: Mailketing API')
          console.log('   Template:', renderedEmail.templateName)
          return { success: true, provider: 'mailketing', template: renderedEmail.templateName }
        } else {
          console.warn('⚠️ Mailketing send failed:', result.error || result.message)
        }
      } else {
        console.warn('⚠️ Template rendering returned null')
      }
    } catch (templateError: any) {
      console.warn('⚠️ Branded template error:', templateError?.message)
      console.warn('   Will try fallback method...')
    }

    // Fallback: Use hardcoded template from mailketing.ts (priority 2)
    if (mailketingConfigured) {
      console.log('   Trying fallback: hardcoded template from mailketing.ts')
      try {
        const { sendVerificationEmail: sendMail } = await import('./integrations/mailketing')
        const result = await sendMail(email, name, verificationUrl)
        
        if (result.success) {
          console.log('✅ Verification email sent via hardcoded template')
          console.log('   Provider: Mailketing API')
          console.log('   Template: Hardcoded HTML')
          return { success: true, provider: 'mailketing', template: 'hardcoded' }
        } else {
          console.error('❌ Hardcoded template also failed:', result.error || result.message)
        }
      } catch (fallbackError: any) {
        console.error('❌ Fallback template error:', fallbackError?.message)
      }
    }
    
    // Dev mode or fallback: Console output only (priority 3)
    console.log('💡 FALLBACK MODE: Email sending failed, using console logging')
    console.log('===================================')
    console.log('📧 EMAIL VERIFIKASI (FALLBACK)')
    console.log('To:', email)
    console.log('Name:', name)
    console.log('Verification URL:', verificationUrl)
    console.log('Mailketing Configured:', mailketingConfigured)
    console.log('===================================')
    
    // Return success to not block user registration/flow
    return { success: true, devMode: true, provider: 'console', fallback: true }
    
  } catch (error: any) {
    console.error('❌ Email verification send error:', error?.message || 'Unknown error')
    console.error('   Stack:', error?.stack)
    
    // Final fallback: Log to console
    console.log('===================================')
    console.log('📧 EMAIL VERIFIKASI (ERROR FALLBACK)')
    console.log('To:', email)
    console.log('Name:', name)
    console.log('Verification URL:', verificationUrl)
    console.log('Error:', error?.message || 'Unknown error')
    console.log('===================================')
    
    // Don't block user flow on email failure - graceful degradation
    return { 
      success: true, 
      devMode: true, 
      provider: 'console', 
      error: error?.message || 'Email sending failed but user flow continues',
      fallback: true 
    }
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

// Auto-verify Gmail email (skip manual verification)
export async function autoVerifyGmailEmail(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true }
  })

  if (!user) {
    return false
  }

  // Only auto-verify if it's a Gmail email
  if (!isValidGmailEmail(user.email)) {
    return false
  }

  // Mark as verified if not already
  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    })

    // Clean up any pending tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { identifier: userId }
    })

    return true
  }

  return user.emailVerified
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
