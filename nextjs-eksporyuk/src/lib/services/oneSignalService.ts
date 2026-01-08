/**
 * OneSignal Service for Push Notifications
 */

export interface OneSignalNotificationData {
  title: string
  message: string
  userId?: string
  userIds?: string[]
  url?: string
  data?: Record<string, any>
}

class OneSignalService {
  private appId: string | undefined
  private restApiKey: string | undefined

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID
    this.restApiKey = process.env.ONESIGNAL_REST_API_KEY
  }

  async sendNotification(data: OneSignalNotificationData) {
    if (!this.appId || !this.restApiKey) {
      console.log('[ONESIGNAL] Service not configured - skipping notification')
      return { success: false, error: 'OneSignal not configured' }
    }

    try {
      const payload = {
        app_id: this.appId,
        headings: { en: data.title },
        contents: { en: data.message },
        ...(data.userId ? { filters: [{ field: 'tag', key: 'userId', relation: '=', value: data.userId }] } : {}),
        ...(data.userIds ? { include_external_user_ids: data.userIds } : {}),
        ...(data.url ? { url: data.url } : {}),
        ...(data.data ? { data: data.data } : {})
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`OneSignal API error: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, data: result }

    } catch (error) {
      console.error('[ONESIGNAL] Error sending notification:', error)
      return { success: false, error: error.message }
    }
  }

  async sendToUser(userId: string, title: string, message: string, options?: { url?: string, data?: Record<string, any> }) {
    return this.sendNotification({
      title,
      message,
      userId,
      url: options?.url,
      data: options?.data
    })
  }

  async sendToUsers(userIds: string[], title: string, message: string, options?: { url?: string, data?: Record<string, any> }) {
    return this.sendNotification({
      title,
      message,
      userIds,
      url: options?.url,
      data: options?.data
    })
  }
}

export const oneSignalService = new OneSignalService()