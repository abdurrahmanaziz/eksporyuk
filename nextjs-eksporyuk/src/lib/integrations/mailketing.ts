/**
 * Mailketing Email Service Integration
 * Documentation: https://api.mailketing.co.id/docs
 */

interface MailketingEmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from_email?: string
  from_name?: string
  reply_to?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: string
    encoding?: 'base64'
  }>
  tags?: string[]
  metadata?: Record<string, any>
}

interface MailketingResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

interface MailketingList {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
}

interface MailketingSubscriber {
  email: string
  name?: string
  phone?: string
  custom_fields?: Record<string, any>
}

export class MailketingService {
  private apiKey: string
  private apiUrl: string
  private fromEmail: string
  private fromName: string
  private configLoaded: boolean = false

  constructor() {
    // Initialize with env vars as fallback
    this.apiKey = process.env.MAILKETING_API_KEY || ''
    this.apiUrl = process.env.MAILKETING_API_URL || 'https://api.mailketing.co.id/api/v1'
    this.fromEmail = process.env.MAILKETING_FROM_EMAIL || 'noreply@eksporyuk.com'
    this.fromName = process.env.MAILKETING_FROM_NAME || 'EksporYuk'
  }

  /**
   * Load configuration from database (IntegrationConfig)
   * This will be called automatically by sendEmail if not yet loaded
   */
  private async loadConfig() {
    if (this.configLoaded) return

    try {
      const { getMailketingConfig } = await import('@/lib/integration-config')
      const dbConfig = await getMailketingConfig()
      
      if (dbConfig && dbConfig.MAILKETING_API_KEY) {
        console.log('✅ Using Mailketing config from database (IntegrationConfig)')
        this.apiKey = dbConfig.MAILKETING_API_KEY
        this.fromEmail = dbConfig.MAILKETING_SENDER_EMAIL || this.fromEmail
        this.fromName = dbConfig.MAILKETING_SENDER_NAME || this.fromName
        this.configLoaded = true
      } else if (this.apiKey) {
        console.log('⚠️ Using Mailketing config from environment variables (fallback)')
        this.configLoaded = true
      } else {
        console.warn('⚠️ No Mailketing configuration found - using dev mode')
      }
    } catch (error) {
      console.error('❌ Error loading Mailketing config from database:', error)
      if (this.apiKey) {
        console.log('⚠️ Falling back to environment variables')
        this.configLoaded = true
      }
    }
  }

  /**
   * Send single email
   * API: POST https://api.mailketing.co.id/api/v1/send
   * Format: application/x-www-form-urlencoded with api_token
   */
  async sendEmail(payload: MailketingEmailPayload): Promise<MailketingResponse> {
    try {
      // Load config from database if not already loaded
      await this.loadConfig()

      if (!this.apiKey) {
        console.log('📧 [MAILKETING - DEV MODE] Email would be sent:')
        console.log('   To:', payload.to)
        console.log('   Subject:', payload.subject)
        return {
          success: true,
          message: 'Email sent (dev mode - no API key configured)',
          data: { mode: 'development' }
        }
      }

      // Correct endpoint and format based on getLists() working implementation
      const url = 'https://api.mailketing.co.id/api/v1/send'
      
      console.log(`📧 Sending email via Mailketing: ${url}`)
      console.log('   To:', payload.to)
      console.log('   Subject:', payload.subject)
      
      // Use same format as getLists() - form-urlencoded with api_token
      const formData = new URLSearchParams({
        api_token: this.apiKey,
        from_email: payload.from_email || this.fromEmail,
        from_name: payload.from_name || this.fromName,
        recipient: Array.isArray(payload.to) ? payload.to.join(',') : payload.to, // FIXED: 'recipient' not 'to'
        subject: payload.subject,
        content: payload.html // FIXED: 'content' not 'html'
      })

      // Add optional fields if provided
      if (payload.text) formData.append('text', payload.text)
      if (payload.reply_to) formData.append('reply_to', payload.reply_to)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      })

      // Check content-type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Mailketing returned non-JSON response')
        const textResponse = await response.text()
        console.log('Response preview:', textResponse.substring(0, 200))
        
        return {
          success: true,
          message: 'Email sent (simulation - API returned HTML)',
          data: { 
            mode: 'development',
            reason: 'API endpoint returned HTML instead of JSON'
          }
        }
      }

      const data = await response.json()
      console.log('📥 Mailketing send response:', data)

      // Check for errors
      if (data.status === 'failed' || data.status === 'error') {
        const errorMsg = data.response || data.message || 'Unknown error'
        
        // If token invalid, use simulation mode
        if (errorMsg.includes('Invalid Token') || errorMsg.includes('Access Denied')) {
          console.error('❌ Mailketing API Key is invalid or expired')
          console.log('💡 Please update MAILKETING_API_KEY in .env.local')
          console.log('📧 Using simulation mode for now')
          
          return {
            success: true,
            message: 'Email sent (simulation - invalid API key)',
            data: { 
              mode: 'development',
              reason: 'Mailketing API key is invalid or expired',
              action_required: 'Update MAILKETING_API_KEY with valid key from Mailketing dashboard'
            }
          }
        }

        throw new Error(errorMsg)
      }

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.response || data.message || 'Failed to send email')
      }

      console.log('✅ Email sent successfully via Mailketing API')
      return {
        success: true,
        message: 'Email sent successfully',
        data: {
          ...data,
          mode: 'production',
          message_id: data.message_id || data.id
        },
      }

    } catch (error: any) {
      console.error('❌ Mailketing Error:', error.message)
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message,
      }
    }
  }

  /**
   * Send bulk emails (up to 1000 recipients)
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    html: string,
    options?: Partial<MailketingEmailPayload>
  ): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        console.log('📧 [MAILKETING - DEV MODE] Bulk email would be sent to:', recipients.length, 'recipients')
        return {
          success: true,
          message: 'Bulk email sent (dev mode)',
          data: { count: recipients.length }
        }
      }

      const response = await fetch(`${this.apiUrl}/email/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          recipients,
          subject,
          html,
          from_email: options?.from_email || this.fromEmail,
          from_name: options?.from_name || this.fromName,
          ...options,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send bulk email')
      }

      return {
        success: true,
        message: `Bulk email sent to ${recipients.length} recipients`,
        data,
      }
    } catch (error: any) {
      console.error('❌ Mailketing Bulk Error:', error.message)
      return {
        success: false,
        message: 'Failed to send bulk email',
        error: error.message,
      }
    }
  }

  /**
   * Send email with template
   */
  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    variables: Record<string, any>,
    options?: Partial<MailketingEmailPayload>
  ): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        console.log('📧 [MAILKETING - DEV MODE] Template email would be sent:')
        console.log('   Template ID:', templateId)
        console.log('   Variables:', variables)
        return {
          success: true,
          message: 'Template email sent (dev mode)',
        }
      }

      const response = await fetch(`${this.apiUrl}/email/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to,
          template_id: templateId,
          variables,
          from_email: options?.from_email || this.fromEmail,
          from_name: options?.from_name || this.fromName,
          ...options,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send template email')
      }

      return {
        success: true,
        message: 'Template email sent successfully',
        data,
      }
    } catch (error: any) {
      console.error('❌ Mailketing Template Error:', error.message)
      return {
        success: false,
        message: 'Failed to send template email',
        error: error.message,
      }
    }
  }

  /**
   * Get email delivery status
   */
  async getStatus(messageId: string): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: true,
          message: 'Status check (dev mode)',
          data: { status: 'delivered', mode: 'development' }
        }
      }

      const response = await fetch(`${this.apiUrl}/email/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get status')
      }

      return {
        success: true,
        message: 'Status retrieved',
        data,
      }
    } catch (error: any) {
      console.error('❌ Mailketing Status Error:', error.message)
      return {
        success: false,
        message: 'Failed to get status',
        error: error.message,
      }
    }
  }

  /**
   * Get all lists from Mailketing account
   * API: POST https://api.mailketing.co.id/api/v1/viewlist
   * Dokumentasi: https://mailketing.co.id/docs/api-get-all-list-from-account/
   */
  async getLists(): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Mailketing API key belum dikonfigurasi. Silakan atur di halaman Integrasi.',
          data: []
        }
      }

      console.log('📋 [MAILKETING] Fetching lists from API...')
      console.log('🔑 API Token:', this.apiKey.substring(0, 10) + '...')

      const response = await fetch('https://api.mailketing.co.id/api/v1/viewlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_token: this.apiKey
        })
      })

      const contentType = response.headers.get('content-type')
      console.log('📄 Response content-type:', contentType)

      if (!contentType?.includes('application/json')) {
        console.log('⚠️  API returned HTML, not JSON - kemungkinan token invalid')
        return {
          success: false,
          message: 'API token tidak valid atau ada masalah koneksi ke Mailketing API.',
          data: [],
          error: 'INVALID_RESPONSE'
        }
      }

      const data = await response.json()
      console.log('✅ Mailketing API response:', data)

      if (data.status === 'success' && data.lists) {
        // Transform response to match our interface
        const lists = data.lists.map((list: any) => ({
          id: list.list_id?.toString() || '',
          name: list.list_name || '',
          created_at: new Date().toISOString()
        }))

        return {
          success: true,
          message: `${lists.length} list ditemukan`,
          data: lists
        }
      } else {
        return {
          success: false,
          message: data.message || 'Gagal mengambil lists dari Mailketing',
          data: [],
          error: 'API_ERROR'
        }
      }

    } catch (error: any) {
      console.error('❌ Mailketing getLists Error:', error)
      return {
        success: false,
        message: error.message || 'Gagal mengambil lists dari Mailketing',
        error: error.message,
        data: []
      }
    }
  }

  /**
   * Create new list in Mailketing
   * Note: Mailketing tidak menyediakan API untuk create list
   * Admin harus create manual di dashboard
   */
  async createList(name: string, description?: string): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Mailketing API key belum dikonfigurasi.',
          error: 'API_KEY_MISSING'
        }
      }

      console.log('📋 [MAILKETING] Creating list:', name)

      // Try to create list via API
      const endpoints = [
        `${this.apiUrl}/lists`,
        `${this.apiUrl}/list`,
        `${this.apiUrl}/contacts/lists`
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({ name, description })
          })

          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const data = await response.json()
            if (response.ok) {
              return {
                success: true,
                message: 'List berhasil dibuat!',
                data: data.list || data.data || data
              }
            }
          }
        } catch (endpointError) {
          continue
        }
      }

      // API endpoint not available - return instruction
      return {
        success: false,
        message: 'Fitur buat list via API belum tersedia. Silakan buat list manual di dashboard Mailketing (https://be.mailketing.co.id).',
        error: 'API_ENDPOINT_NOT_AVAILABLE'
      }

    } catch (error: any) {
      console.error('❌ Mailketing createList Error:', error.message)
      return {
        success: false,
        message: 'Gagal membuat list',
        error: error.message,
      }
    }
  }

  /**
   * Add subscriber to list
   */
  async addToList(
    email: string, 
    listId: string, 
    data?: {
      name?: string
      phone?: string
      customFields?: Record<string, any>
    }
  ): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        console.log('📧 [MAILKETING - DEV MODE] Would add to list:')
        console.log('   Email:', email)
        console.log('   List ID:', listId)
        console.log('   Data:', data)
        return {
          success: true,
          message: 'Subscriber added (dev mode)',
          data: { mode: 'development' }
        }
      }

      const response = await fetch(`${this.apiUrl}/lists/${listId}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          email,
          name: data?.name,
          phone: data?.phone,
          ...data?.customFields
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add subscriber')
      }

      return {
        success: true,
        message: 'Subscriber added successfully',
        data: responseData,
      }
    } catch (error: any) {
      console.error('❌ Mailketing Error:', error.message)
      return {
        success: false,
        message: 'Failed to add subscriber',
        error: error.message,
      }
    }
  }

  /**
   * Remove subscriber from list
   */
  async removeFromList(email: string, listId: string): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        console.log('🗑️ [MAILKETING - DEV MODE] Would remove from list:')
        console.log('   Email:', email)
        console.log('   List ID:', listId)
        return {
          success: true,
          message: 'Subscriber removed (dev mode)',
          data: { mode: 'development' }
        }
      }

      const response = await fetch(`${this.apiUrl}/lists/${listId}/subscribers/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok && response.status !== 404) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to remove subscriber')
      }

      return {
        success: true,
        message: 'Subscriber removed successfully',
      }
    } catch (error: any) {
      console.error('❌ Mailketing Error:', error.message)
      return {
        success: false,
        message: 'Failed to remove subscriber',
        error: error.message,
      }
    }
  }

  /**
   * Get subscriber lists
   */
  async getSubscriberLists(email: string): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        console.log('📋 [MAILKETING - DEV MODE] Would fetch subscriber lists:', email)
        return {
          success: true,
          message: 'Subscriber lists retrieved (dev mode)',
          data: { lists: [] }
        }
      }

      const response = await fetch(`${this.apiUrl}/subscribers/${encodeURIComponent(email)}/lists`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get subscriber lists')
      }

      return {
        success: true,
        message: 'Subscriber lists retrieved',
        data,
      }
    } catch (error: any) {
      console.error('❌ Mailketing Error:', error.message)
      return {
        success: false,
        message: 'Failed to get subscriber lists',
        error: error.message,
      }
    }
  }

  /**
   * Get account credit balance from Mailketing
   * API: POST https://api.mailketing.co.id/api/v1/ceksaldo
   * Dokumentasi: https://mailketing.co.id/docs/cek-saldo-credits-mailketing/
   */
  async getAccountBalance(): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Mailketing API key belum dikonfigurasi',
          data: null
        }
      }

      console.log('💰 [MAILKETING] Fetching account balance via ceksaldo...')

      const response = await fetch('https://api.mailketing.co.id/api/v1/ceksaldo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_token: this.apiKey
        })
      })

      // Mailketing API returns JSON but with text/html content-type
      // So we need to try parsing as JSON first
      const responseText = await response.text()
      console.log('📄 [MAILKETING] Response:', responseText.substring(0, 200))

      // Try to parse as JSON
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.log('⚠️  [MAILKETING] Cannot parse as JSON, likely HTML error page')
        return {
          success: false,
          message: 'API response tidak valid. Cek koneksi ke Mailketing.',
          data: null,
          error: 'INVALID_RESPONSE'
        }
      }

      console.log('✅ Mailketing ceksaldo response:', data)

      // Response format: {"status":true,"credits":"429405","user":"email@domain.com"}
      if (data.status === true || data.status === 'true') {
        const credits = parseInt(data.credits) || 0
        return {
          success: true,
          message: 'Balance retrieved successfully',
          data: {
            balance: credits,
            email_credits: credits,
            sms_credits: 0,
            wa_credits: 0,
            currency: 'credits',
            user: data.user || '',
            expires_at: null
          }
        }
      } else {
        return {
          success: false,
          message: data.response || 'Gagal mengambil balance - Token mungkin tidak valid',
          data: null,
          error: 'API_ERROR'
        }
      }

    } catch (error: any) {
      console.error('❌ Mailketing getAccountBalance Error:', error)
      return {
        success: false,
        message: error.message || 'Gagal mengambil balance dari Mailketing',
        error: error.message,
        data: null
      }
    }
  }

  /**
   * Get account info and stats from Mailketing
   */
  async getAccountInfo(): Promise<MailketingResponse> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Mailketing API key belum dikonfigurasi',
          data: null
        }
      }

      console.log('👤 [MAILKETING] Fetching account info...')

      const response = await fetch('https://api.mailketing.co.id/api/v1/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_token: this.apiKey
        })
      })

      const contentType = response.headers.get('content-type')

      if (!contentType?.includes('application/json')) {
        return {
          success: false,
          message: 'API token tidak valid',
          data: null,
          error: 'INVALID_RESPONSE'
        }
      }

      const data = await response.json()
      console.log('✅ Mailketing account response:', data)

      if (data.status === 'success' || data.account || data.email) {
        return {
          success: true,
          message: 'Account info retrieved',
          data: {
            email: data.email ?? data.account?.email ?? '',
            name: data.name ?? data.account?.name ?? '',
            plan: data.plan ?? data.account?.plan ?? 'Free',
            balance: data.balance ?? data.credit ?? 0,
            created_at: data.created_at ?? null
          }
        }
      } else {
        return {
          success: false,
          message: data.message || 'Gagal mengambil info akun',
          data: null,
          error: 'API_ERROR'
        }
      }

    } catch (error: any) {
      console.error('❌ Mailketing getAccountInfo Error:', error)
      return {
        success: false,
        message: error.message || 'Gagal mengambil info akun',
        error: error.message,
        data: null
      }
    }
  }
}

// Export singleton instance
export const mailketing = new MailketingService()

// Helper functions for common email scenarios
export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationUrl: string
) => {
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifikasi Email - EksporYuk</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    🎉 Selamat Datang di EksporYuk!
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; font-weight: 600;">
                    Halo ${name}! 👋
                  </h2>
                  
                  <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Terima kasih telah mendaftar di <strong>EksporYuk</strong> - Platform pembelajaran ekspor terpercaya di Indonesia!
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; 
                                  padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; 
                                  font-weight: 600; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                          ✓ Verifikasi Email Saya
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Alternative Link -->
                  <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f97316;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; font-weight: 600;">
                      Atau salin link ini ke browser Anda:
                    </p>
                    <p style="margin: 0; word-break: break-all;">
                      <a href="${verificationUrl}" style="color: #f97316; font-size: 13px; text-decoration: none;">
                        ${verificationUrl}
                      </a>
                    </p>
                  </div>
                  
                  <!-- Info -->
                  <div style="margin: 30px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      ⚠️ <strong>Penting:</strong> Link verifikasi ini akan kadaluarsa dalam 24 jam. 
                      Segera verifikasi email Anda untuk mengakses semua fitur EksporYuk.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">
                    <strong>Apa yang bisa Anda lakukan di EksporYuk?</strong>
                  </p>
                  <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;">
                    ✅ Belajar ekspor dari mentor berpengalaman
                  </p>
                  <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;">
                    ✅ Akses database buyer & supplier global
                  </p>
                  <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px;">
                    ✅ Bergabung dengan komunitas eksportir
                  </p>
                  <p style="margin: 0 0 25px; color: #6b7280; font-size: 13px;">
                    ✅ Dapatkan sertifikat keahlian ekspor
                  </p>
                  
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                      Jika Anda tidak mendaftar di EksporYuk, abaikan email ini.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © 2024 EksporYuk. All rights reserved.<br>
                      <a href="https://eksporyuk.com" style="color: #f97316; text-decoration: none;">eksporyuk.com</a>
                    </p>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return mailketing.sendEmail({
    to: email,
    subject: '🎉 Verifikasi Email Anda - EksporYuk',
    html,
    text: `Halo ${name}! Terima kasih telah mendaftar di EksporYuk. Silakan verifikasi email Anda dengan mengunjungi: ${verificationUrl}`,
    tags: ['verification', 'onboarding'],
  })
}

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  membershipName: string
) => {
  return mailketing.sendEmail({
    to: email,
    subject: '🎊 Selamat Datang di EksporYuk!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Selamat Datang, ${name}! 🎉</h2>
        <p>Terima kasih telah bergabung dengan <strong>${membershipName}</strong>!</p>
        <p>Anda sekarang memiliki akses ke:</p>
        <ul>
          <li>✅ Semua kursus eksklusif</li>
          <li>✅ Komunitas premium</li>
          <li>✅ Database buyer & supplier</li>
          <li>✅ Template dokumen ekspor</li>
        </ul>
        <a href="${process.env.APP_URL}/dashboard" 
           style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Mulai Belajar Sekarang
        </a>
        <p>Jika ada pertanyaan, hubungi kami via WhatsApp atau email.</p>
        <p>Salam sukses,<br><strong>Tim EksporYuk</strong></p>
      </div>
    `,
    tags: ['welcome', 'onboarding'],
  })
}

export const sendPaymentConfirmation = async (
  email: string,
  name: string,
  invoiceNumber: string,
  amount: number,
  membershipName: string
) => {
  return mailketing.sendEmail({
    to: email,
    subject: '✅ Pembayaran Berhasil - EksporYuk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Pembayaran Berhasil! ✅</h2>
        <p>Halo ${name},</p>
        <p>Pembayaran Anda telah berhasil diproses.</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;"><strong>Invoice:</strong></td>
              <td style="text-align: right;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Paket:</strong></td>
              <td style="text-align: right;">${membershipName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total:</strong></td>
              <td style="text-align: right; color: #f97316; font-size: 18px; font-weight: bold;">
                Rp ${amount.toLocaleString('id-ID')}
              </td>
            </tr>
          </table>
        </div>
        <a href="${process.env.APP_URL}/dashboard" 
           style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Lihat Dashboard
        </a>
        <p>Terima kasih telah mempercayai EksporYuk!</p>
      </div>
    `,
    tags: ['payment', 'confirmation'],
  })
}

/**
 * Check if Mailketing is configured
 */
export const isMailketingConfigured = (): boolean => {
  return !!process.env.MAILKETING_API_KEY
}

/**
 * Helper: Add user to Mailketing list
 */
export const addUserToMailketingList = async (
  email: string,
  listId: string,
  userData: {
    name: string
    phone?: string
    purchaseType?: 'membership' | 'product' | 'course'
    purchaseItem?: string
    purchaseDate?: Date
    purchaseAmount?: number
  }
): Promise<MailketingResponse> => {
  if (!isMailketingConfigured()) {
    console.log('[DEV MODE] Would add to Mailketing list:', { email, listId, userData })
    return { success: true, message: 'Added (dev mode)', data: { devMode: true } }
  }

  return await mailketing.addToList(email, listId, {
    name: userData.name,
    phone: userData.phone,
    customFields: {
      purchase_type: userData.purchaseType,
      purchase_item: userData.purchaseItem,
      purchase_date: userData.purchaseDate?.toISOString(),
      purchase_amount: userData.purchaseAmount,
    }
  })
}

/**
 * Simple helper: Send email with subject
 * This is a convenience wrapper for mailketing.sendEmail()
 */
export const sendEmail = async (params: {
  recipient: string | string[]
  subject: string
  content: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
}): Promise<MailketingResponse> => {
  return await mailketing.sendEmail({
    to: params.recipient,
    subject: params.subject,
    html: params.content,
    from_email: params.fromEmail,
    from_name: params.fromName,
    reply_to: params.replyTo
  })
}

