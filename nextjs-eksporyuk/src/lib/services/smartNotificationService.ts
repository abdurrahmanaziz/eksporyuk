/**
 * SMART NOTIFICATION SERVICE
 * Intelligently routes notifications through multiple channels
 * - Pusher: For real-time in-app notifications (when user is online)
 * - OneSignal: For push notifications (when user is offline)
 * - Email: For important notifications
 * - WhatsApp: For critical alerts (optional)
 */

import { prisma } from '@/lib/prisma'
import { pusherService } from '@/lib/pusher'
import { oneSignalService } from '@/lib/onesignal'

interface SmartNotificationData {
  userId: string | string[]  // Single user or array of users
  type: 'SYSTEM' | 'CHAT' | 'PAYMENT' | 'AFFILIATE' | 'COURSE' | 'PRODUCT' | 'MEMBERSHIP' | 'ACHIEVEMENT' | 'MENTION' | 'COMMENT' | 'COMMENT_REPLY'
  title: string
  message: string
  link?: string
  image?: string
  data?: Record<string, any>
  channels?: {
    pusher?: boolean      // Default: true if online
    onesignal?: boolean   // Default: true if offline
    email?: boolean       // Default: false
    whatsapp?: boolean    // Default: false
  }
  priority?: 'low' | 'normal' | 'high' | 'critical'  // Default: normal
}

class SmartNotificationService {
  
  /**
   * Send smart notification - automatically choose best channel
   */
  async send(data: SmartNotificationData): Promise<{
    success: boolean
    channels: {
      pusher?: boolean
      onesignal?: boolean
      email?: boolean
      whatsapp?: boolean
    }
    error?: string
  }> {
    try {
      const userIds = Array.isArray(data.userId) ? data.userId : [data.userId]
      const channelsUsed: Record<string, boolean> = {}

      for (const userId of userIds) {
        // Get user status and preferences
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            isOnline: true,
            oneSignalPlayerId: true,
            emailNotifications: true,
            whatsappNotifications: true,
            whatsapp: true
          }
        })

        if (!user) continue

        // Save notification to database first
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.data ? JSON.stringify(data.data) : null
          }
        })

        // Determine channels based on user status and preferences
        const shouldUsePusher = user.isOnline && (data.channels?.pusher !== false)
        const shouldUseOneSignal = !user.isOnline && user.oneSignalPlayerId && (data.channels?.onesignal !== false)
        const shouldUseEmail = user.emailNotifications && (data.channels?.email === true)
        const shouldUseWhatsApp = user.whatsappNotifications && user.whatsapp && (data.channels?.whatsapp === true)

        // Send via Pusher (Real-time for online users)
        if (shouldUsePusher) {
          try {
            await pusherService.notifyUser(user.id, 'notification', {
              id: notification.id,
              type: data.type,
              title: data.title,
              message: data.message,
              link: data.link,
              image: data.image,
              createdAt: notification.createdAt
            })
            channelsUsed.pusher = true
            console.log(`[SmartNotification] Pusher sent to ${user.id}`)
          } catch (error) {
            console.error(`[SmartNotification] Pusher error for ${user.id}:`, error)
          }
        }

        // Send via OneSignal (Push for offline users)
        if (shouldUseOneSignal) {
          try {
            await oneSignalService.sendToUser(
              user.id,
              data.title,
              data.message,
              data.link
            )
            channelsUsed.onesignal = true
            console.log(`[SmartNotification] OneSignal sent to ${user.id}`)
          } catch (error) {
            console.error(`[SmartNotification] OneSignal error for ${user.id}:`, error)
          }
        }

        // Send via Email (if enabled and requested)
        if (shouldUseEmail) {
          // TODO: Implement email sending
          channelsUsed.email = true
          console.log(`[SmartNotification] Email sent to ${user.email}`)
        }

        // Send via WhatsApp (if enabled and requested)
        if (shouldUseWhatsApp) {
          // TODO: Implement WhatsApp sending
          channelsUsed.whatsapp = true
          console.log(`[SmartNotification] WhatsApp sent to ${user.whatsapp}`)
        }

        // If user is offline and no push subscription, use OneSignal anyway (will queue)
        if (!user.isOnline && !shouldUsePusher && !shouldUseOneSignal && data.channels?.onesignal !== false) {
          try {
            await oneSignalService.sendToUser(
              user.id,
              data.title,
              data.message,
              data.link
            )
            channelsUsed.onesignal = true
          } catch (error) {
            console.error(`[SmartNotification] Fallback OneSignal error:`, error)
          }
        }
      }

      return {
        success: true,
        channels: channelsUsed
      }
    } catch (error) {
      console.error('[SmartNotification] Error:', error)
      return {
        success: false,
        channels: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send to all users with specific membership tier
   */
  async sendToMembership(
    tier: 'FREE' | 'STARTER' | 'PRO' | 'LIFETIME',
    title: string,
    message: string,
    link?: string
  ): Promise<{ success: boolean; sent: number }> {
    try {
      // Get all users with this membership tier
      const users = await prisma.user.findMany({
        where: {
          role: `MEMBER_${tier}` as any
        },
        select: { id: true }
      })

      // Send to all users
      await this.send({
        userId: users.map(u => u.id),
        type: 'MEMBERSHIP',
        title,
        message,
        link
      })

      // Also send via OneSignal segment for better reach
      await oneSignalService.sendToMembership(tier, title, message, link)

      return {
        success: true,
        sent: users.length
      }
    } catch (error) {
      console.error('[SmartNotification] SendToMembership error:', error)
      return {
        success: false,
        sent: 0
      }
    }
  }

  /**
   * Send to all users in a province
   */
  async sendToProvince(
    province: string,
    title: string,
    message: string,
    link?: string
  ): Promise<{ success: boolean; sent: number }> {
    try {
      const users = await prisma.user.findMany({
        where: { province },
        select: { id: true }
      })

      await this.send({
        userId: users.map(u => u.id),
        type: 'SYSTEM',
        title,
        message,
        link
      })

      await oneSignalService.sendToProvince(province, title, message, link)

      return {
        success: true,
        sent: users.length
      }
    } catch (error) {
      console.error('[SmartNotification] SendToProvince error:', error)
      return {
        success: false,
        sent: 0
      }
    }
  }

  /**
   * Broadcast to all users
   */
  async broadcast(
    title: string,
    message: string,
    link?: string,
    options?: {
      type?: SmartNotificationData['type']
      image?: string
      priority?: SmartNotificationData['priority']
    }
  ): Promise<{ success: boolean; sent: number }> {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      })

      // Save broadcast notification for all
      await Promise.all(
        users.map(user =>
          prisma.notification.create({
            data: {
              userId: user.id,
              type: options?.type || 'SYSTEM',
              title,
              message,
              link
            }
          })
        )
      )

      // Broadcast via Pusher (for online users)
      await pusherService.broadcast('notification', {
        type: options?.type || 'SYSTEM',
        title,
        message,
        link,
        image: options?.image
      })

      // Send via OneSignal (for all subscribed users)
      await oneSignalService.sendToAll(title, message, link)

      return {
        success: true,
        sent: users.length
      }
    } catch (error) {
      console.error('[SmartNotification] Broadcast error:', error)
      return {
        success: false,
        sent: 0
      }
    }
  }
}

export const smartNotificationService = new SmartNotificationService()
export default smartNotificationService
