/**
 * OneSignal Push Notification Integration
 * Documentation: https://documentation.onesignal.com/docs/server-api-overview
 */

interface OneSignalNotificationPayload {
  headings: { en: string; id?: string }
  contents: { en: string; id?: string }
  subtitle?: { en: string; id?: string }
  data?: Record<string, any>
  url?: string
  web_url?: string
  app_url?: string
  buttons?: Array<{
    id: string
    text: string
    icon?: string
    url?: string
  }>
  large_icon?: string
  big_picture?: string
  adm_big_picture?: string
  chrome_big_picture?: string
  ios_attachments?: Record<string, string>
  ios_sound?: string
  android_sound?: string
  android_led_color?: string
  android_accent_color?: string
  android_visibility?: number
  collapse_id?: string
  priority?: number
  ttl?: number
  send_after?: string
}

interface OneSignalTargeting {
  included_segments?: string[]
  excluded_segments?: string[]
  include_player_ids?: string[]
  include_external_user_ids?: string[]
  filters?: Array<{
    field: string
    key?: string
    relation: string
    value: string
  }>
}

interface OneSignalResponse {
  success: boolean
  message: string
  data?: any
  error?: string
  id?: string
  recipients?: number
}

export class OneSignalService {
  private appId: string
  private restApiKey: string
  private apiUrl: string

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || ''
    // Support both ONESIGNAL_API_KEY and ONESIGNAL_REST_API_KEY
    this.restApiKey = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_REST_API_KEY || ''
    this.apiUrl = 'https://onesignal.com/api/v1'

    if (!this.appId || !this.restApiKey) {
      console.warn('⚠️ ONESIGNAL_APP_ID or ONESIGNAL_API_KEY not configured')
    }
  }

  /**
   * Send push notification
   */
  async sendNotification(
    payload: OneSignalNotificationPayload,
    targeting: OneSignalTargeting
  ): Promise<OneSignalResponse> {
    try {
      if (!this.appId || !this.restApiKey) {
        console.log('🔔 [ONESIGNAL - DEV MODE] Push notification would be sent:')
        console.log('   Heading:', payload.headings.en)
        console.log('   Content:', payload.contents.en)
        console.log('   Targeting:', targeting)
        return {
          success: true,
          message: 'Push notification sent (dev mode)',
          data: { mode: 'development' }
        }
      }

      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          ...payload,
          ...targeting,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.join(', ') || 'Failed to send push notification')
      }

      return {
        success: true,
        message: 'Push notification sent successfully',
        data,
        id: data.id,
        recipients: data.recipients,
      }
    } catch (error: any) {
      console.error('❌ OneSignal Error:', error.message)
      return {
        success: false,
        message: 'Failed to send push notification',
        error: error.message,
      }
    }
  }

  /**
   * Send to all users
   */
  async sendToAll(
    heading: string,
    content: string,
    options?: Partial<OneSignalNotificationPayload>
  ): Promise<OneSignalResponse> {
    return this.sendNotification(
      {
        headings: { en: heading, id: heading },
        contents: { en: content, id: content },
        ...options,
      },
      {
        included_segments: ['All'],
      }
    )
  }

  /**
   * Send to specific user IDs
   */
  async sendToUsers(
    userIds: string[],
    heading: string,
    content: string,
    options?: Partial<OneSignalNotificationPayload>
  ): Promise<OneSignalResponse> {
    return this.sendNotification(
      {
        headings: { en: heading, id: heading },
        contents: { en: content, id: content },
        ...options,
      },
      {
        include_external_user_ids: userIds,
      }
    )
  }

  /**
   * Send to specific segments
   */
  async sendToSegment(
    segment: string,
    heading: string,
    content: string,
    options?: Partial<OneSignalNotificationPayload>
  ): Promise<OneSignalResponse> {
    return this.sendNotification(
      {
        headings: { en: heading, id: heading },
        contents: { en: content, id: content },
        ...options,
      },
      {
        included_segments: [segment],
      }
    )
  }

  /**
   * Send with filters
   */
  async sendWithFilters(
    filters: Array<{
      field: string
      key?: string
      relation: string
      value: string
    }>,
    heading: string,
    content: string,
    options?: Partial<OneSignalNotificationPayload>
  ): Promise<OneSignalResponse> {
    return this.sendNotification(
      {
        headings: { en: heading, id: heading },
        contents: { en: content, id: content },
        ...options,
      },
      {
        filters,
      }
    )
  }

  /**
   * Get notification details
   */
  async getNotification(notificationId: string): Promise<OneSignalResponse> {
    try {
      if (!this.appId || !this.restApiKey) {
        return {
          success: true,
          message: 'Notification details (dev mode)',
          data: { mode: 'development' }
        }
      }

      const response = await fetch(
        `${this.apiUrl}/notifications/${notificationId}?app_id=${this.appId}`,
        {
          headers: {
            'Authorization': `Basic ${this.restApiKey}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.join(', ') || 'Failed to get notification')
      }

      return {
        success: true,
        message: 'Notification details retrieved',
        data,
      }
    } catch (error: any) {
      console.error('❌ OneSignal Get Error:', error.message)
      return {
        success: false,
        message: 'Failed to get notification',
        error: error.message,
      }
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<OneSignalResponse> {
    try {
      if (!this.appId || !this.restApiKey) {
        return {
          success: true,
          message: 'Notification cancelled (dev mode)',
        }
      }

      const response = await fetch(
        `${this.apiUrl}/notifications/${notificationId}?app_id=${this.appId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${this.restApiKey}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.join(', ') || 'Failed to cancel notification')
      }

      return {
        success: true,
        message: 'Notification cancelled successfully',
        data,
      }
    } catch (error: any) {
      console.error('❌ OneSignal Cancel Error:', error.message)
      return {
        success: false,
        message: 'Failed to cancel notification',
        error: error.message,
      }
    }
  }
}

// Export singleton instance
export const onesignal = new OneSignalService()

// Helper functions for common notification scenarios
export const sendWelcomeNotification = async (userId: string, name: string) => {
  return onesignal.sendToUsers(
    [userId],
    '🎉 Selamat Datang!',
    `Halo ${name}! Terima kasih telah bergabung dengan EksporYuk.`,
    {
      data: { type: 'welcome', userId },
      url: `${process.env.APP_URL}/dashboard`,
    }
  )
}

export const sendPaymentSuccessNotification = async (
  userId: string,
  membershipName: string
) => {
  return onesignal.sendToUsers(
    [userId],
    '✅ Pembayaran Berhasil',
    `Pembayaran ${membershipName} Anda telah dikonfirmasi. Selamat belajar!`,
    {
      data: { type: 'payment_success', userId },
      url: `${process.env.APP_URL}/dashboard`,
      large_icon: 'https://eksporyuk.com/logo.png',
    }
  )
}

export const sendNewCourseNotification = async (
  segment: string,
  courseName: string,
  courseUrl: string
) => {
  return onesignal.sendToSegment(
    segment,
    '📚 Kursus Baru Tersedia!',
    `Kursus "${courseName}" sudah bisa diakses sekarang.`,
    {
      data: { type: 'new_course', courseName },
      url: courseUrl,
    }
  )
}

export const sendExpiryReminderNotification = async (
  userId: string,
  daysLeft: number
) => {
  return onesignal.sendToUsers(
    [userId],
    '⏰ Membership Akan Berakhir',
    `Membership Anda akan berakhir dalam ${daysLeft} hari. Perpanjang sekarang!`,
    {
      data: { type: 'expiry_reminder', daysLeft },
      url: `${process.env.APP_URL}/membership/renew`,
      buttons: [
        {
          id: 'renew',
          text: 'Perpanjang Sekarang',
          url: `${process.env.APP_URL}/membership/renew`,
        },
      ],
    }
  )
}

export const sendBulkAnnouncementNotification = async (
  heading: string,
  content: string,
  url?: string
) => {
  return onesignal.sendToAll(heading, content, {
    data: { type: 'announcement' },
    url,
    large_icon: 'https://eksporyuk.com/logo.png',
  })
}
