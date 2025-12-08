/**
 * STARSENDER INTEGRATION
 * WhatsApp notification service
 */

interface StarsenderConfig {
  apiKey: string
  apiUrl: string
  deviceId: string
}

interface WhatsAppMessage {
  to: string  // Format: 628123456789 (tanpa +)
  message: string
  image?: string
  buttons?: string[]
}

class StarsenderService {
  private config: StarsenderConfig

  constructor() {
    this.config = {
      apiKey: process.env.STARSENDER_API_KEY || '',
      apiUrl: process.env.STARSENDER_API_URL || 'https://api.starsender.online/api',
      deviceId: process.env.STARSENDER_DEVICE_ID || ''
    }
  }

  async sendWhatsApp(data: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.apiKey || !this.config.deviceId) {
        throw new Error('Starsender API key or device ID not configured')
      }

      // Clean phone number - remove +, spaces, dashes
      const cleanPhone = data.to.replace(/[\s\-\+]/g, '')
      
      // Ensure format 628xxx
      const phoneNumber = cleanPhone.startsWith('0') 
        ? '62' + cleanPhone.substring(1)
        : cleanPhone.startsWith('62') 
        ? cleanPhone 
        : '62' + cleanPhone

      const response = await fetch(`${this.config.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          device_id: this.config.deviceId,
          number: phoneNumber,
          message: data.message,
          ...(data.image && { image: data.image }),
          ...(data.buttons && { buttons: data.buttons })
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Starsender error: ${error}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        messageId: result.message_id || result.id
      }
    } catch (error: any) {
      console.error('[STARSENDER] Send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async sendBulk(messages: WhatsAppMessage[]): Promise<{ 
    success: boolean
    sent: number
    failed: number
    errors?: string[]
  }> {
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const msg of messages) {
      const result = await this.sendWhatsApp(msg)
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${msg.to}: ${result.error}`)
      }
      
      // Rate limit: wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return {
      success: failed === 0,
      sent,
      failed,
      ...(errors.length > 0 && { errors })
    }
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.deviceId)
  }
}

export const starsenderService = new StarsenderService()
export default starsenderService
