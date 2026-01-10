/**
 * Starsender WhatsApp Service Integration
 * Documentation: https://starsender.online/docs
 */

interface StarsenderMessagePayload {
  phone: string
  message: string
  type?: 'text' | 'image' | 'video' | 'document' | 'audio'
  media_url?: string
  filename?: string
  caption?: string
  buttons?: Array<{
    id: string
    text: string
  }>
}

interface StarsenderBulkPayload {
  recipients: Array<{
    phone: string
    name?: string
    variables?: Record<string, string>
  }>
  message: string
  delay?: number // delay between messages in seconds
}

interface StarsenderResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

export class StarsenderService {
  private apiKey: string
  private apiUrl: string
  private deviceId: string

  constructor() {
    this.apiKey = process.env.STARSENDER_API_KEY || ''
    this.apiUrl = process.env.STARSENDER_API_URL || 'https://api.starsender.online/api'
    this.deviceId = process.env.STARSENDER_DEVICE_ID || ''

    if (!this.apiKey || !this.deviceId) {
      console.warn('⚠️ STARSENDER_API_KEY or STARSENDER_DEVICE_ID not configured')
    }
  }

  /**
   * Format phone number to WhatsApp format (62xxx)
   */
  private formatPhone(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')
    
    // If starts with 0, replace with 62
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1)
    }
    
    // If doesn't start with 62, add it
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned
    }
    
    return cleaned
  }

  /**
   * Replace variables in message template
   */
  private replaceVariables(message: string, variables?: Record<string, string>): string {
    if (!variables) return message
    
    let result = message
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
    
    return result
  }

  /**
   * Send single WhatsApp message
   */
  async sendMessage(payload: StarsenderMessagePayload): Promise<StarsenderResponse> {
    try {
      if (!this.apiKey || !this.deviceId) {
        console.log('📱 [STARSENDER - DEV MODE] WhatsApp would be sent:')
        console.log('   To:', payload.phone)
        console.log('   Message:', payload.message)
        return {
          success: true,
          message: 'WhatsApp sent (dev mode)',
          data: { mode: 'development' }
        }
      }

      const formattedPhone = this.formatPhone(payload.phone)

      const { phone, ...restPayload } = payload
      
      const response = await fetch(`${this.apiUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          device_id: this.deviceId,
          phone: formattedPhone,
          ...restPayload,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send WhatsApp message')
      }

      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        data,
      }
    } catch (error: any) {
      console.error('❌ Starsender Error:', error.message)
      return {
        success: false,
        message: 'Failed to send WhatsApp message',
        error: error.message,
      }
    }
  }

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulkMessage(payload: StarsenderBulkPayload): Promise<StarsenderResponse> {
    try {
      if (!this.apiKey || !this.deviceId) {
        console.log('📱 [STARSENDER - DEV MODE] Bulk WhatsApp would be sent to:', payload.recipients.length, 'recipients')
        return {
          success: true,
          message: 'Bulk WhatsApp sent (dev mode)',
          data: { count: payload.recipients.length }
        }
      }

      const messages = payload.recipients.map(recipient => ({
        phone: this.formatPhone(recipient.phone),
        message: this.replaceVariables(payload.message, recipient.variables),
      }))

      const response = await fetch(`${this.apiUrl}/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          device_id: this.deviceId,
          messages,
          delay: payload.delay || 3,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send bulk WhatsApp')
      }

      return {
        success: true,
        message: `Bulk WhatsApp sent to ${messages.length} recipients`,
        data,
      }
    } catch (error: any) {
      console.error('❌ Starsender Bulk Error:', error.message)
      return {
        success: false,
        message: 'Failed to send bulk WhatsApp',
        error: error.message,
      }
    }
  }

  /**
   * Send WhatsApp with media (image, video, document)
   */
  async sendMedia(
    phone: string,
    mediaUrl: string,
    type: 'image' | 'video' | 'document',
    caption?: string,
    filename?: string
  ): Promise<StarsenderResponse> {
    return this.sendMessage({
      phone,
      message: caption || '',
      type,
      media_url: mediaUrl,
      caption,
      filename,
    })
  }

  /**
   * Check device status
   */
  async getDeviceStatus(): Promise<StarsenderResponse> {
    try {
      if (!this.apiKey || !this.deviceId) {
        return {
          success: true,
          message: 'Device status (dev mode)',
          data: { status: 'connected', mode: 'development' }
        }
      }

      const response = await fetch(`${this.apiUrl}/device/status/${this.deviceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get device status')
      }

      return {
        success: true,
        message: 'Device status retrieved',
        data,
      }
    } catch (error: any) {
      console.error('❌ Starsender Device Error:', error.message)
      return {
        success: false,
        message: 'Failed to get device status',
        error: error.message,
      }
    }
  }
}

// Export singleton instance
export const starsender = new StarsenderService()

// Helper functions for common WhatsApp scenarios
export const sendVerificationWhatsApp = async (
  phone: string,
  name: string,
  verificationCode: string
) => {
  const message = `
🎉 *Halo ${name}!*

Terima kasih telah mendaftar di *EksporYuk*.

Kode Verifikasi Anda:
*${verificationCode}*

Masukkan kode ini untuk verifikasi akun Anda.

_Kode berlaku selama 10 menit._

Salam,
*Tim EksporYuk* 🚀
  `.trim()

  return starsender.sendMessage({
    phone,
    message,
  })
}

export const sendWelcomeWhatsApp = async (
  phone: string,
  name: string,
  membershipName: string
) => {
  const message = `
🎊 *Selamat Datang ${name}!*

Terima kasih telah bergabung dengan *${membershipName}*!

Anda sekarang memiliki akses ke:
✅ Semua kursus eksklusif
✅ Komunitas premium
✅ Database buyer & supplier
✅ Template dokumen ekspor

Mulai belajar di:
${process.env.APP_URL}/dashboard

Butuh bantuan? Chat admin kami!

Salam sukses,
*Tim EksporYuk* 🚀
  `.trim()

  return starsender.sendMessage({
    phone,
    message,
  })
}

export const sendPaymentReminderWhatsApp = async (
  phone: string,
  name: string,
  invoiceNumber: string,
  amount: number,
  paymentUrl: string
) => {
  const message = `
💳 *Reminder Pembayaran*

Halo ${name},

Kami menunggu pembayaran Anda untuk:

Invoice: *${invoiceNumber}*
Total: *Rp ${amount.toLocaleString('id-ID')}*

Bayar sekarang:
${paymentUrl}

Terima kasih!
*Tim EksporYuk* 🚀
  `.trim()

  return starsender.sendMessage({
    phone,
    message,
  })
}

export const sendFollowUpWhatsApp = async (
  phone: string,
  name: string,
  message: string
) => {
  const personalizedMessage = message
    .replace(/{{name}}/g, name)
    .replace(/{{first_name}}/g, name.split(' ')[0])

  return starsender.sendMessage({
    phone,
    message: personalizedMessage,
  })
}
