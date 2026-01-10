/**
 * Pusher Real-time Updates Integration
 * Documentation: https://pusher.com/docs
 */

import Pusher from 'pusher'
import PusherClient from 'pusher-js'

interface PusherEventPayload {
  channel: string
  event: string
  data: any
  socketId?: string
}

interface PusherResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

export class PusherService {
  private pusher: Pusher | null = null
  private appId: string
  private key: string
  private secret: string
  private cluster: string

  constructor() {
    this.appId = process.env.PUSHER_APP_ID || ''
    this.key = process.env.PUSHER_KEY || ''
    this.secret = process.env.PUSHER_SECRET || ''
    this.cluster = process.env.PUSHER_CLUSTER || 'ap1'

    if (!this.appId || !this.key || !this.secret) {
      console.warn('⚠️ PUSHER credentials not configured')
    } else {
      this.pusher = new Pusher({
        appId: this.appId,
        key: this.key,
        secret: this.secret,
        cluster: this.cluster,
        useTLS: true,
      })
    }
  }

  /**
   * Trigger event on a channel
   */
  async trigger(payload: PusherEventPayload): Promise<PusherResponse> {
    try {
      if (!this.pusher) {
        console.log('⚡ [PUSHER - DEV MODE] Event would be triggered:')
        console.log('   Channel:', payload.channel)
        console.log('   Event:', payload.event)
        console.log('   Data:', payload.data)
        return {
          success: true,
          message: 'Event triggered (dev mode)',
          data: { mode: 'development' }
        }
      }

      const triggerOptions = payload.socketId ? { socket_id: payload.socketId } : undefined
      
      await this.pusher.trigger(
        payload.channel,
        payload.event,
        payload.data,
        triggerOptions
      )

      return {
        success: true,
        message: 'Event triggered successfully',
      }
    } catch (error: any) {
      console.error('❌ Pusher Trigger Error:', error.message)
      return {
        success: false,
        message: 'Failed to trigger event',
        error: error.message,
      }
    }
  }

  /**
   * Trigger event on multiple channels
   */
  async triggerBatch(
    channels: string[],
    event: string,
    data: any
  ): Promise<PusherResponse> {
    try {
      if (!this.pusher) {
        console.log('⚡ [PUSHER - DEV MODE] Batch event would be triggered:')
        console.log('   Channels:', channels.length)
        console.log('   Event:', event)
        return {
          success: true,
          message: 'Batch event triggered (dev mode)',
          data: { count: channels.length }
        }
      }

      await this.pusher.triggerBatch(
        channels.map(channel => ({
          channel,
          name: event,
          data,
        }))
      )

      return {
        success: true,
        message: `Event triggered on ${channels.length} channels`,
      }
    } catch (error: any) {
      console.error('❌ Pusher Batch Error:', error.message)
      return {
        success: false,
        message: 'Failed to trigger batch event',
        error: error.message,
      }
    }
  }

  /**
   * Get channel info
   */
  async getChannel(channelName: string): Promise<PusherResponse> {
    try {
      if (!this.pusher) {
        return {
          success: true,
          message: 'Channel info (dev mode)',
          data: { mode: 'development' }
        }
      }

      const channel = await this.pusher.get({
        path: `/channels/${channelName}`,
      })

      return {
        success: true,
        message: 'Channel info retrieved',
        data: channel,
      }
    } catch (error: any) {
      console.error('❌ Pusher Get Channel Error:', error.message)
      return {
        success: false,
        message: 'Failed to get channel info',
        error: error.message,
      }
    }
  }

  /**
   * Get all channels
   */
  async getChannels(prefix?: string): Promise<PusherResponse> {
    try {
      if (!this.pusher) {
        return {
          success: true,
          message: 'Channels list (dev mode)',
          data: { mode: 'development', channels: [] }
        }
      }

      const params = prefix ? `?filter_by_prefix=${prefix}` : ''
      const channels = await this.pusher.get({
        path: `/channels${params}`,
      })

      return {
        success: true,
        message: 'Channels list retrieved',
        data: channels,
      }
    } catch (error: any) {
      console.error('❌ Pusher Get Channels Error:', error.message)
      return {
        success: false,
        message: 'Failed to get channels list',
        error: error.message,
      }
    }
  }

  /**
   * Authenticate private channel
   */
  authenticatePrivateChannel(socketId: string, channelName: string): string {
    if (!this.pusher) {
      return JSON.stringify({ auth: 'dev-mode' })
    }

    return this.pusher.authorizeChannel(socketId, channelName).auth
  }

  /**
   * Authenticate presence channel
   */
  authenticatePresenceChannel(
    socketId: string,
    channelName: string,
    userData: { user_id: string; user_info: any }
  ): any {
    if (!this.pusher) {
      return { auth: 'dev-mode', channel_data: JSON.stringify(userData) }
    }

    return this.pusher.authorizeChannel(socketId, channelName, userData)
  }
}

// Export singleton instance
export const pusher = new PusherService()

// Client-side Pusher helper
export const createPusherClient = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1'

  if (!key) {
    console.warn('⚠️ NEXT_PUBLIC_PUSHER_KEY not configured')
    return null
  }

  return new PusherClient(key, {
    cluster,
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
}

// Helper functions for common real-time scenarios

/**
 * Trigger new message in chat
 */
export const triggerNewMessage = async (
  groupId: string,
  message: {
    id: string
    userId: string
    userName: string
    content: string
    timestamp: string
  }
) => {
  return pusher.trigger({
    channel: `group-${groupId}`,
    event: 'new-message',
    data: message,
  })
}

/**
 * Trigger user online status
 */
export const triggerUserOnline = async (userId: string, isOnline: boolean) => {
  return pusher.trigger({
    channel: 'presence-users',
    event: 'user-status',
    data: { userId, isOnline, timestamp: new Date().toISOString() },
  })
}

/**
 * Trigger new notification
 */
export const triggerNotification = async (
  userId: string,
  notification: {
    id: string
    type: string
    title: string
    message: string
    url?: string
  }
) => {
  return pusher.trigger({
    channel: `user-${userId}`,
    event: 'new-notification',
    data: notification,
  })
}

/**
 * Trigger new post in group
 */
export const triggerNewPost = async (
  groupId: string,
  post: {
    id: string
    userId: string
    userName: string
    content: string
    timestamp: string
  }
) => {
  return pusher.trigger({
    channel: `group-${groupId}`,
    event: 'new-post',
    data: post,
  })
}

/**
 * Trigger membership activated
 */
export const triggerMembershipActivated = async (
  userId: string,
  membership: {
    id: string
    name: string
    duration: string
    endDate: string
  }
) => {
  return pusher.trigger({
    channel: `user-${userId}`,
    event: 'membership-activated',
    data: membership,
  })
}

/**
 * Trigger payment status update
 */
export const triggerPaymentUpdate = async (
  userId: string,
  payment: {
    transactionId: string
    status: string
    amount: number
  }
) => {
  return pusher.trigger({
    channel: `user-${userId}`,
    event: 'payment-update',
    data: payment,
  })
}

/**
 * Broadcast to all users
 */
export const broadcastAnnouncement = async (announcement: {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  url?: string
}) => {
  return pusher.trigger({
    channel: 'public-announcements',
    event: 'new-announcement',
    data: announcement,
  })
}

/**
 * Trigger course progress update
 */
export const triggerCourseProgress = async (
  userId: string,
  progress: {
    courseId: string
    courseName: string
    completedLessons: number
    totalLessons: number
    percentage: number
  }
) => {
  return pusher.trigger({
    channel: `user-${userId}`,
    event: 'course-progress',
    data: progress,
  })
}
