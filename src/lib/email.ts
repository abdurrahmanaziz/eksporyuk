/**
 * Email Service
 * Wrapper for sending transactional emails (password reset, verification, etc)
 * Uses Mailketing API for actual delivery
 */

import { mailketing } from './integrations/mailketing'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  tags?: string[]
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, text, tags } = params

  try {
    console.log('[EMAIL] Sending transactional email via Mailketing:', {
      to,
      subject,
      htmlLength: html.length,
      textLength: text?.length || 0
    })

    // Use Mailketing service for actual email delivery
    const result = await mailketing.sendEmail({
      to,
      subject,
      html,
      text,
      tags: tags || ['transactional']
    })

    if (result.success) {
      console.log('[EMAIL] ✅ Email sent successfully via Mailketing')
      return { success: true }
    } else {
      console.error('[EMAIL] ❌ Mailketing error:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error('[EMAIL] Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, baseUrl: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Reset Password</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Halo,
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Atau copy dan paste link berikut ke browser Anda:
          </p>
          <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6b7280;">
            Link ini akan kadaluarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Salam,<br>
            <strong>Tim Eksporyuk</strong>
          </p>
        </div>
      </body>
    </html>
  `

  const text = `
    Reset Password

    Halo,

    Kami menerima permintaan untuk mereset password akun Anda. Klik link berikut untuk membuat password baru:
    
    ${resetUrl}
    
    Link ini akan kadaluarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
    
    Salam,
    Tim Eksporyuk
  `

  return sendEmail({
    to: email,
    subject: 'Reset Password - Eksporyuk',
    html,
    text
  })
}

/**
 * Send email verification
 */
export async function sendEmailVerification(email: string, verificationToken: string, baseUrl: string) {
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifikasi Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Verifikasi Email</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Selamat datang di Eksporyuk!
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Terima kasih telah mendaftar. Silakan verifikasi email Anda dengan klik tombol di bawah:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Verifikasi Email
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Atau copy dan paste link berikut ke browser Anda:
          </p>
          <p style="font-size: 14px; color: #10b981; word-break: break-all;">
            ${verifyUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6b7280;">
            Link ini akan kadaluarsa dalam 24 jam.
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Salam,<br>
            <strong>Tim Eksporyuk</strong>
          </p>
        </div>
      </body>
    </html>
  `

  const text = `
    Verifikasi Email

    Selamat datang di Eksporyuk!

    Terima kasih telah mendaftar. Silakan verifikasi email Anda dengan klik link berikut:
    
    ${verifyUrl}
    
    Link ini akan kadaluarsa dalam 24 jam.
    
    Salam,
    Tim Eksporyuk
  `

  return sendEmail({
    to: email,
    subject: 'Verifikasi Email - Eksporyuk',
    html,
    text
  })
}
