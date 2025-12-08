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

      console.log('[MAILKETING] Attempting to send via API:', {
        url: `${this.mailketingApiUrl}/email/send`,
        to,
        subject: subject.substring(0, 50)
      })

      // Send via Mailketing API
      const response = await fetch(`${this.mailketingApiUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.mailketingApiKey}`,
        },
        body: JSON.stringify({
          from_email: from || 'noreply@eksporyuk.com',
          from_name: 'EksporYuk',
          to,
          subject,
          html: finalHtml,
          track_opens: true,
          track_clicks: true,
        }),
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type')
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
            console.error('[MAILKETING] API error:', errorData)
          } catch (e) {
            // Failed to parse JSON error
            const text = await response.text()
            console.error('[MAILKETING] API error (non-JSON):', text.substring(0, 200))
          }
        } else {
          const text = await response.text()
          console.error('[MAILKETING] API error (HTML response):', text.substring(0, 200))
          errorMessage = 'API endpoint not found or returned invalid response'
        }
        
        return { success: false, error: errorMessage }
      }

      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('[MAILKETING] Success but non-JSON response:', text.substring(0, 200))
        return { success: false, error: 'Invalid API response format' }
      }

      const result = await response.json()
      console.log('[MAILKETING] Email sent successfully:', result)
      return { success: true, messageId: result.message_id || result.id || `mk_${Date.now()}` }
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
}

export const mailketingService = new MailketingService()

