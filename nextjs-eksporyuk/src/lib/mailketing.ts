/**
 * MAILKETING INTEGRATION
 * Email marketing service untuk notifications
 */

interface MailketingConfig {
  apiKey: string
  apiUrl: string
  fromEmail: string
  fromName: string
}

interface EmailData {
  to: string
  subject: string
  body: string
  listId?: string
}

class MailketingService {
  private config: MailketingConfig

  constructor() {
    this.config = {
      apiKey: process.env.MAILKETING_API_KEY || '',
      apiUrl: process.env.MAILKETING_API_URL || 'https://api.mailketing.co.id/v1',
      fromEmail: process.env.MAILKETING_SENDER_EMAIL || 'noreply@eksporyuk.com',
      fromName: process.env.MAILKETING_SENDER_NAME || 'EksporYuk'
    }
  }

  async sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Mailketing API key not configured')
      }

      const response = await fetch(`${this.config.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          from: {
            email: this.config.fromEmail,
            name: this.config.fromName
          },
          to: data.to,
          subject: data.subject,
          html: data.body
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Mailketing error: ${error}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        messageId: result.message_id || result.id
      }
    } catch (error: any) {
      console.error('[MAILKETING] Send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async addToList(email: string, listId: string, name?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Mailketing API key not configured')
      }

      const response = await fetch(`${this.config.apiUrl}/lists/${listId}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0],
          status: 'active'
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Mailketing list error: ${error}`)
      }

      return { success: true }
    } catch (error: any) {
      console.error('[MAILKETING] Add to list error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey
  }
}

export const mailketingService = new MailketingService()
export default mailketingService
