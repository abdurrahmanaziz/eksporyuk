/**
 * ONESIGNAL INTEGRATION
 * Push notification service
 */

interface OneSignalConfig {
  appId: string
  apiKey: string
}

interface PushNotification {
  userIds?: string[]
  segments?: string[]  // 'All', 'Active Users', 'Subscribed Users', 'Free Members', 'Pro Members', etc
  filters?: Array<{ field: string; relation: string; value: string }>  // Advanced filtering
  heading: string
  content: string
  url?: string
  data?: Record<string, any>
  image?: string
  buttons?: Array<{ id: string; text: string; url?: string }>
}

class OneSignalService {
  private config: OneSignalConfig

  constructor() {
    this.config = {
      appId: process.env.ONESIGNAL_APP_ID || '',
      apiKey: process.env.ONESIGNAL_API_KEY || ''
    }
  }

  async sendNotification(notification: PushNotification): Promise<{ 
    success: boolean
    notificationId?: string
    recipients?: number
    error?: string 
  }> {
    try {
      if (!this.config.appId || !this.config.apiKey) {
        throw new Error('OneSignal not configured')
      }

      const payload: any = {
        app_id: this.config.appId,
        headings: { en: notification.heading },
        contents: { en: notification.content }
      }

      // Target users
      if (notification.userIds && notification.userIds.length > 0) {
        payload.include_external_user_ids = notification.userIds
      } else if (notification.filters && notification.filters.length > 0) {
        payload.filters = notification.filters
      } else if (notification.segments && notification.segments.length > 0) {
        payload.included_segments = notification.segments
      } else {
        payload.included_segments = ['Subscribed Users']
      }

      // Optional fields
      if (notification.url) {
        payload.url = notification.url
      }
      if (notification.data) {
        payload.data = notification.data
      }
      if (notification.image) {
        payload.big_picture = notification.image
        payload.ios_attachments = { id: notification.image }
      }
      if (notification.buttons && notification.buttons.length > 0) {
        payload.buttons = notification.buttons
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config.apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors?.[0] || 'OneSignal API error')
      }

      const result = await response.json()
      
      return {
        success: true,
        notificationId: result.id,
        recipients: result.recipients
      }
    } catch (error: any) {
      console.error('[ONESIGNAL] Send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async sendToUser(userId: string, options: {
    headings?: { en: string; id?: string };
    contents?: { en: string; id?: string };
    url?: string;
    data?: Record<string, any>;
  } | string, content?: string, url?: string): Promise<{ 
    success: boolean
    error?: string 
  }> {
    // Support both old (string params) and new (object param) signatures
    let notification: PushNotification;
    
    if (typeof options === 'string') {
      // Old signature: sendToUser(userId, heading, content, url)
      notification = {
        userIds: [userId],
        heading: options,
        content: content || '',
        url: url
      }
    } else {
      // New signature: sendToUser(userId, { headings, contents, url, data })
      notification = {
        userIds: [userId],
        heading: options.headings?.en || options.headings?.id || '',
        content: options.contents?.en || options.contents?.id || '',
        url: options.url,
        data: options.data
      }
    }
    
    const result = await this.sendNotification(notification)
    
    return {
      success: result.success,
      error: result.error
    }
  }

  async sendToAll(heading: string, content: string, url?: string): Promise<{ 
    success: boolean
    recipients?: number
    error?: string 
  }> {
    return await this.sendNotification({
      segments: ['Subscribed Users'],
      heading,
      content,
      url
    })
  }

  /**
   * Send to users by membership tier
   */
  async sendToMembership(
    tier: 'FREE' | 'STARTER' | 'PRO' | 'LIFETIME',
    heading: string,
    content: string,
    url?: string
  ): Promise<{ success: boolean; recipients?: number; error?: string }> {
    return await this.sendNotification({
      filters: [
        { field: 'tag', relation: '=', value: `role-${tier}` }
      ],
      heading,
      content,
      url
    })
  }

  /**
   * Send to users by province/location
   */
  async sendToProvince(
    province: string,
    heading: string,
    content: string,
    url?: string
  ): Promise<{ success: boolean; recipients?: number; error?: string }> {
    return await this.sendNotification({
      filters: [
        { field: 'tag', relation: '=', value: `province-${province}` }
      ],
      heading,
      content,
      url
    })
  }

  isConfigured(): boolean {
    return !!(this.config.appId && this.config.apiKey)
  }
}

export const oneSignalService = new OneSignalService()
export default oneSignalService

/**
 * Direct function to send notification via OneSignal API
 * Used by admin routes for more control over payload
 */
export async function sendOneSignalNotification(payload: any): Promise<any> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY

  if (!appId || !apiKey) {
    throw new Error('OneSignal not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY.')
  }

  // Add app_id to payload
  payload.app_id = appId

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[OneSignal] API Error:', error)
    throw new Error(error.errors?.[0] || 'OneSignal API error')
  }

  return await response.json()
}

/**
 * Get OneSignal app info and segments
 */
export async function getOneSignalAppInfo(): Promise<any> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY

  if (!appId || !apiKey) {
    return null
  }

  try {
    const response = await fetch(`https://onesignal.com/api/v1/apps/${appId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${apiKey}`
      }
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[OneSignal] Get app info error:', error)
    return null
  }
}

/**
 * Get notification history from OneSignal
 */
export async function getOneSignalNotificationHistory(limit = 20, offset = 0): Promise<any> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY

  if (!appId || !apiKey) {
    return { notifications: [] }
  }

  try {
    const response = await fetch(
      `https://onesignal.com/api/v1/notifications?app_id=${appId}&limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      return { notifications: [] }
    }

    return await response.json()
  } catch (error) {
    console.error('[OneSignal] Get history error:', error)
    return { notifications: [] }
  }
}
