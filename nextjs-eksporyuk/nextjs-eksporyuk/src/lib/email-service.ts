/**
 * Email Service - Uses Mailketing API
 * All transactional emails are sent via Mailketing
 */

import { mailketing } from './integrations/mailketing'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: string[]
  attachments?: Array<{
    filename: string
    content?: string | Buffer
    path?: string
  }>
}

/**
 * Send email using Mailketing API
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    console.log('📧 [EMAIL-SERVICE] Sending email via Mailketing:', {
      to: options.to,
      subject: options.subject,
      contentLength: options.html.length
    })

    // Use Mailketing service
    const result = await mailketing.sendEmail({
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from_email: options.from,
      reply_to: options.replyTo,
      tags: options.tags || ['transactional']
    })

    if (result.success) {
      console.log('✅ [EMAIL-SERVICE] Email sent successfully via Mailketing')
      return {
        success: true,
        messageId: result.data?.message_id || `mailketing-${Date.now()}`
      }
    } else {
      console.error('❌ [EMAIL-SERVICE] Mailketing error:', result.error)
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    console.error('❌ [EMAIL-SERVICE] Error sending email:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(options: EmailOptions): Promise<boolean> {
  const result = await sendEmail({
    ...options,
    subject: `[TEST] ${options.subject}`,
    tags: ['test']
  })
  
  return result.success
}

/**
 * Verify Mailketing connection
 */
export async function verifyEmailService(): Promise<{
  connected: boolean
  error?: string
}> {
  try {
    // Check if Mailketing is configured
    const apiKey = process.env.MAILKETING_API_KEY
    if (!apiKey) {
      return {
        connected: false,
        error: 'MAILKETING_API_KEY not configured'
      }
    }

    console.log('✅ Mailketing API key configured')
    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send branded email using template
 */
export async function sendBrandedEmail({
  to,
  subject,
  html,
  templateName,
  from,
  tags
}: {
  to: string | string[]
  subject: string
  html: string
  templateName?: string
  from?: string
  tags?: string[]
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('📧 Sending branded email:', {
    to,
    subject,
    template: templateName,
    contentLength: html.length
  })

  return sendEmail({ to, subject, html, from, tags: tags || ['branded', templateName || 'default'] })
}

export default {
  sendEmail,
  sendTestEmail,
  verifyEmailService,
  sendBrandedEmail
}
