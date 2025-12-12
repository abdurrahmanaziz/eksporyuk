import { prisma } from '@/lib/prisma'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  broadcastId?: string
  leadId?: string
}

interface SendBroadcastParams {
  affiliateId: string
  broadcastId: string
  leadIds: string[]
}

/**
 * Mailketing Service
 * Handles email sending for automation and broadcast with tracking
 */
class MailketingService {
  private mailketingApiUrl: string
  private mailketingApiKey: string

  constructor() {
    // Load from environment variables
    this.mailketingApiUrl = process.env.MAILKETING_API_URL || 'https://api.mailketing.com/v1'
    this.mailketingApiKey = process.env.MAILKETING_API_KEY || ''
    
    // Log configuration status
    if (!this.mailketingApiKey) {
      console.log('⚠️ [MAILKETING] API key not configured - running in simulation mode')
    } else {
      console.log('✅ [MAILKETING] API configured:', {
        url: this.mailketingApiUrl,
        hasApiKey: !!this.mailketingApiKey
      })
    }
  }

  /**
   * Generate tracking pixel URL
   */
  private getTrackingPixelUrl(broadcastId: string, leadId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'
    return `${baseUrl}/api/track/open?bid=${broadcastId}&lid=${leadId}`
  }

  /**
   * Rewrite links in email body for click tracking
   */
  private rewriteLinksForTracking(html: string, broadcastId: string, leadId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'
    
    // Replace all href links with tracking URL
    return html.replace(
      /href=["']([^"']+)["']/g,
      (match, url) => {
        const trackingUrl = `${baseUrl}/api/track/click?bid=${broadcastId}&lid=${leadId}&url=${encodeURIComponent(url)}`
        return `href="${trackingUrl}"`
      }
    )
  }

  /**
   * Insert tracking pixel into email HTML
   */
  private insertTrackingPixel(html: string, broadcastId: string, leadId: string): string {
    const pixelUrl = this.getTrackingPixelUrl(broadcastId, leadId)
    const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`
    
    // Insert before closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`)
    }
    
    // Otherwise append at the end
    return html + trackingPixel
  }

  /**
   * Replace template variables
   */
  private replaceVariables(template: string, lead: any): string {
    let result = template

    // Replace {{name}} with lead name
    result = result.replace(/\{\{name\}\}/gi, lead.name || 'Customer')
    
    // Replace {{email}} with lead email
    result = result.replace(/\{\{email\}\}/gi, lead.email || '')
    
    // Replace {{phone}} with lead phone
    result = result.replace(/\{\{phone\}\}/gi, lead.phone || lead.whatsapp || '')

    // Replace {{first_name}} - get first word of name
    const firstName = (lead.name || 'Customer').split(' ')[0]
    result = result.replace(/\{\{first_name\}\}/gi, firstName)

    return result
  }

  /**
   * Send single email (used by automation and broadcast)
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const { to, subject, html, from, broadcastId, leadId } = params

    try {
      // Validate email
      if (!this.isValidEmail(to)) {
        return { success: false, error: 'Invalid email address' }
      }

      let finalHtml = html

      // Add tracking if broadcast context exists
      if (broadcastId && leadId) {
        finalHtml = this.insertTrackingPixel(finalHtml, broadcastId, leadId)
        finalHtml = this.rewriteLinksForTracking(finalHtml, broadcastId, leadId)
      }

      // Check if Mailketing API is configured
      if (!this.mailketingApiKey) {
        console.log('[MAILKETING] API not configured, simulating send:', {
          to,
          subject,
          from: from || 'noreply@eksporyuk.com',
          htmlLength: finalHtml.length
        })
        
        // Simulate async email sending
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('✅ [MAILKETING SIMULATION] Email "sent" successfully')
        return { success: true, messageId: `sim_${Date.now()}` }
      }

      console.log('[MAILKETING] Attempting to send via correct API integration:', {
        to,
        subject: subject.substring(0, 50)
      })

      // Use correct Mailketing API via integration
      const mailketing = await import('@/lib/integrations/mailketing')
      const result = await mailketing.sendEmail({
        recipient: to,
        subject,
        content: finalHtml,
        fromEmail: from || 'noreply@eksporyuk.com',
        fromName: 'EksporYuk'
      })

      if (!result.success) {
        console.error('[MAILKETING] Failed to send:', result.error)
        return { success: false, error: result.error }
      }

      console.log('[MAILKETING] Email sent successfully via integration')
      return { success: true, messageId: result.message || `mk_${Date.now()}` }
    } catch (error: any) {
      console.error('[MAILKETING] Failed to send email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send broadcast email to multiple leads
   */
  async sendBroadcast(params: SendBroadcastParams): Promise<{ sent: number; failed: number }> {
    const { affiliateId, broadcastId, leadIds } = params

    let sent = 0
    let failed = 0

    try {
      // Get broadcast details
      const broadcast = await prisma.affiliateBroadcast.findUnique({
        where: { id: broadcastId },
        include: {
          affiliate: {
            include: {
              user: true
            }
          }
        }
      })

      if (!broadcast) {
        throw new Error('Broadcast not found')
      }

      // Get leads
      const leads = await prisma.affiliateLead.findMany({
        where: {
          id: { in: leadIds },
          affiliateId,
          email: { not: null }
        }
      })

      console.log(`[MAILKETING] Starting broadcast ${broadcastId} to ${leads.length} leads`)

      // Send email to each lead
      for (const lead of leads) {
        try {
          if (!lead.email) continue

          // Replace variables in subject and body
          const subject = this.replaceVariables(broadcast.subject, lead)
          const html = this.replaceVariables(broadcast.body, lead)

          const result = await this.sendEmail({
            to: lead.email,
            subject,
            html,
            from: 'noreply@eksporyuk.com',
            broadcastId: broadcast.id,
            leadId: lead.id,
          })

          if (result.success) {
            sent++
            
            // Update log to SENT
            await prisma.affiliateBroadcastLog.updateMany({
              where: {
                broadcastId: broadcast.id,
                leadId: lead.id,
              },
              data: {
                status: 'SENT',
                sentAt: new Date(),
              }
            })
          } else {
            failed++
            
            // Update log to FAILED
            await prisma.affiliateBroadcastLog.updateMany({
              where: {
                broadcastId: broadcast.id,
                leadId: lead.id,
              },
              data: {
                status: 'FAILED',
                failedAt: new Date(),
                errorMessage: result.error || 'Unknown error',
              }
            })
          }
        } catch (error: any) {
          failed++
          console.error(`[MAILKETING] Failed to send to ${lead.email}:`, error)
          
          // Update log to FAILED
          await prisma.affiliateBroadcastLog.updateMany({
            where: {
              broadcastId: broadcast.id,
              leadId: lead.id,
            },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
              errorMessage: error.message,
            }
          })
        }
      }

      // Update broadcast stats
      await prisma.affiliateBroadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'SENT',
          sentCount: sent,
          failedCount: failed,
          completedAt: new Date(),
        },
      })

      console.log(`[MAILKETING] Broadcast ${broadcastId} completed: ${sent} sent, ${failed} failed`)

      return { sent, failed }
    } catch (error) {
      console.error('[MAILKETING] Broadcast failed:', error)
      throw error
    }
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Send password reset email via Mailketing using branded template
   */
  async sendPasswordResetEmail({
    email,
    name,
    resetLink
  }: {
    email: string
    name: string
    resetLink: string
  }): Promise<void> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address')
      }

      // Use sendBrandedEmail helper with reset-password template
      // If template doesn't exist, will use fallback
      const { sendEmailWithFallback } = await import('@/lib/email-template-helper')
      
      const appName = process.env.NEXT_PUBLIC_APP_NAME || 'EksporYuk'

      // Fallback template if branded template doesn't exist
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 30px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; color: #856404; }
            .footer { color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🔐 Reset Password</h1>
            </div>
            
            <div class="content">
              <p>Halo <strong>${name}</strong>,</p>
              
              <p>Kami menerima permintaan untuk mereset password akun Anda di ${appName}.</p>
              
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin: 20px 0;">
                Atau copy link berikut ke browser Anda:<br/>
                <code style="background: white; border: 1px solid #ddd; padding: 10px; display: inline-block; word-break: break-all; font-size: 12px;">${resetLink}</code>
              </p>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Penting:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Link ini berlaku selama 1 jam</li>
                  <li>Jangan bagikan link ini kepada siapapun</li>
                  <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Salam,<br/><strong>Tim ${appName}</strong></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      // Try to use branded template first, fallback to hardcoded
      await sendEmailWithFallback(
        email,
        'reset-password', // Slug template (create later if needed)
        {
          userName: name,
          resetLink: resetLink,
          expiryTime: '1 jam'
        },
        `🔐 Reset Password - ${appName}`,
        fallbackHtml
      )

      console.log(`✅ [MAILKETING] Password reset email sent to ${email}`)
    } catch (error) {
      console.error(`❌ [MAILKETING] Failed to send password reset email:`, error)
      throw error
    }
  }

  /**
   * Send password reset confirmation email via Mailketing
   */
  async sendPasswordResetConfirmationEmail({
    email,
    name
  }: {
    email: string
    name: string
  }): Promise<void> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address')
      }

      const appName = process.env.NEXT_PUBLIC_APP_NAME || 'EksporYuk'
      const loginUrl = `${process.env.NEXTAUTH_URL}/login`

      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 30px 0; }
            .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; color: #856404; }
            .footer { color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">✅ Password Berhasil Direset</h1>
            </div>
            
            <div class="content">
              <p>Halo <strong>${name}</strong>,</p>
              
              <p>Password akun Anda telah berhasil direset pada tanggal hari ini.</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>📅 Tanggal & Waktu:</strong><br/>
                ${new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              <p>Sekarang Anda dapat login dengan password baru Anda.</p>
              
              <p style="text-align: center;">
                <a href="${loginUrl}" class="button">Login Sekarang</a>
              </p>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Jika Anda tidak melakukan perubahan ini:</strong></p>
                <p style="margin: 5px 0;">Segera hubungi tim support kami untuk mengamankan akun Anda.</p>
              </div>
              
              <div class="footer">
                <p>Salam,<br/><strong>Tim ${appName}</strong></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      // Use sendEmailWithFallback helper for correct API format
      const { sendEmailWithFallback } = await import('@/lib/email-template-helper')
      await sendEmailWithFallback(
        email,
        'password-reset-confirmation',
        {
          userName: name,
          resetDate: new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          loginUrl
        },
        `✅ Password Berhasil Direset - ${appName}`,
        htmlTemplate
      )
      
      console.log(`✅ [MAILKETING] Password reset confirmation sent to ${email}`)
    } catch (error) {
      console.error(`❌ [MAILKETING] Failed to send password reset confirmation:`, error)
      throw error
    }
  }
}

export const mailketingService = new MailketingService()

