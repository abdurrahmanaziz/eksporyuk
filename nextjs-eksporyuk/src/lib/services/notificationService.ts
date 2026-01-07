/**
 * NOTIFICATION SERVICE (PRD v7.3)
 * Complete real-time notification system
 */

import { NotificationType, NotificationSubscription } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { pusherService } from '@/lib/pusher'
import { oneSignalService } from '@/lib/onesignal'
import { mailketingService } from '@/lib/services/mailketingService'
import { starsenderService } from '@/lib/services/starsenderService'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  
  // Source tracking
  sourceType?: string
  sourceId?: string
  
  // Related entities
  postId?: string
  commentId?: string
  eventId?: string
  courseId?: string
  groupId?: string
  transactionId?: string
  
  // Content
  link?: string
  redirectUrl?: string
  image?: string
  icon?: string
  
  // Actor info
  actorId?: string
  actorName?: string
  actorAvatar?: string
  
  // Additional data
  metadata?: Record<string, any>
  
  // Channel preferences
  channels?: ('pusher' | 'onesignal' | 'email' | 'whatsapp')[]
}

export interface BulkNotificationData {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  link?: string
  image?: string
  channels?: ('pusher' | 'onesignal' | 'email' | 'whatsapp')[]
}

class NotificationService {
  
  /**
   * Send notification to a single user
   */
  async send(data: NotificationData): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Check user's notification preferences
      const preferences = await this.getUserPreferences(data.userId)
      
      // Check if notification type is enabled
      if (!this.isNotificationTypeEnabled(preferences, data.type)) {
        return { success: true, notificationId: 'skipped' }
      }
      
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          postId: data.postId,
          commentId: data.commentId,
          eventId: data.eventId,
          courseId: data.courseId,
          groupId: data.groupId,
          transactionId: data.transactionId,
          link: data.link || data.redirectUrl,
          redirectUrl: data.redirectUrl,
          image: data.image,
          icon: data.icon,
          actorId: data.actorId,
          actorName: data.actorName,
          actorAvatar: data.actorAvatar,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
          channels: data.channels ? JSON.parse(JSON.stringify(data.channels)) : ['pusher', 'onesignal'],
          isSent: false,
          isRead: false
        }
      })
      
      // Send via multiple channels
      const channels = data.channels || ['pusher', 'onesignal']
      const results = await Promise.allSettled([
        // Real-time via Pusher (always send if user preference allows, default true)
        channels.includes('pusher') && (preferences?.enableAllInApp !== false)
          ? this.sendViaPusher(data.userId, notification)
          : Promise.resolve({ success: true }),
        
        // Push notification via OneSignal
        channels.includes('onesignal') && (preferences?.enableAllPush !== false)
          ? this.sendViaPush(data)
          : Promise.resolve({ success: true }),
        
        // Email notification
        channels.includes('email') && preferences?.enableAllEmail
          ? this.sendViaEmail(data)
          : Promise.resolve({ success: true }),
        
        // WhatsApp notification
        channels.includes('whatsapp') && preferences?.enableAllWhatsApp
          ? this.sendViaWhatsApp(data)
          : Promise.resolve({ success: true })
      ])
      
      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          isSent: true,
          sentAt: new Date()
        }
      })
      
      return {
        success: true,
        notificationId: notification.id
      }
    } catch (error: any) {
      console.error('[NotificationService] Send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Send notification to multiple users
   */
  async sendBulk(data: BulkNotificationData): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0
    let failed = 0
    
    for (const userId of data.userIds) {
      const result = await this.send({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        image: data.image,
        channels: data.channels
      })
      
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }
    
    return { success: true, sent, failed }
  }
  
  /**
   * Send notification to all subscribers of a target (group, course, event)
   */
  async sendToSubscribers(
    subscriptionType: string,
    targetId: string,
    notificationData: Omit<NotificationData, 'userId'>
  ): Promise<{ success: boolean; sent: number }> {
    try {
      // Get all subscribers
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: {
          subscriptionType,
          targetId,
          enableInApp: true // At least in-app enabled
        }
      })
      
      let sent = 0
      
      for (const sub of subscriptions) {
        const channels: ('pusher' | 'onesignal' | 'email' | 'whatsapp')[] = []
        
        if (sub.enableInApp) channels.push('pusher')
        if (sub.enablePush) channels.push('onesignal')
        if (sub.enableEmail) channels.push('email')
        if (sub.enableWhatsApp) channels.push('whatsapp')
        
        const result = await this.send({
          ...notificationData,
          userId: sub.userId,
          channels
        })
        
        if (result.success) sent++
      }
      
      return { success: true, sent }
    } catch (error: any) {
      console.error('[NotificationService] SendToSubscribers error:', error)
      return { success: false, sent: 0 }
    }
  }
  
  /**
   * Send via Pusher (real-time WebSocket)
   * IMPORTANT: Channel name must match client-side subscription: user-${userId}
   */
  private async sendViaPusher(userId: string, notification: any): Promise<{ success: boolean }> {
    try {
      // Send data that works with both NotificationBell direct handler and usePusherNotification hook
      const result = await pusherService.notifyUser(userId, 'notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,      // For NotificationBell direct handler
        content: notification.message,      // For usePusherNotification hook
        link: notification.link,            // For NotificationBell direct handler  
        url: notification.link,             // For usePusherNotification hook
        image: notification.image,
        icon: notification.icon,
        actorName: notification.actorName,
        actorAvatar: notification.actorAvatar,
        createdAt: notification.createdAt,
        isRead: false,
        timestamp: Date.now()               // For usePusherNotification hook
      })
      
      if (!result.success) {
        console.warn(`[NotificationService] Pusher send failed for user ${userId}: ${result.error}`)
      } else {
        console.log(`[NotificationService] Pusher notification sent to user ${userId}`)
      }
      
      return result
    } catch (error: any) {
      console.error('[NotificationService] Pusher error:', error)
      return { success: false }
    }
  }
  
  /**
   * Send via OneSignal (push notification)
   */
  private async sendViaPush(data: NotificationData): Promise<{ success: boolean }> {
    try {
      const result = await oneSignalService.sendToUser(data.userId, {
        headings: { en: data.title, id: data.title },
        contents: { en: data.message, id: data.message },
        url: data.link || data.redirectUrl,
        data: {
          type: data.type,
          userId: data.userId,
          postId: data.postId,
          groupId: data.groupId,
          courseId: data.courseId,
          link: data.link || data.redirectUrl
        }
      })
      
      if (!result.success) {
        console.warn(`[NotificationService] OneSignal failed: ${result.error}`)
      }
      
      return { success: result.success }
    } catch (error: any) {
      console.error('[NotificationService] OneSignal error:', error)
      return { success: false }
    }
  }
  
  /**
   * Send push notification only (OneSignal) without saving to database
   * Used for chat messages to avoid cluttering the notification bell
   */
  async sendPushOnly(data: { userId: string; title: string; message: string; link?: string }): Promise<{ success: boolean }> {
    try {
      // Check if user has push notifications enabled
      const preferences = await this.getUserPreferences(data.userId)
      if (!preferences.pushEnabled) {
        return { success: false }
      }
      
      const result = await oneSignalService.sendToUser(data.userId, {
        headings: { en: data.title, id: data.title },
        contents: { en: data.message, id: data.message },
        url: data.link
      })
      
      return { success: result.success }
    } catch (error) {
      console.error('[NotificationService] Push only error:', error)
      return { success: false }
    }
  }
  
  /**
   * Send via Email (Mailketing)
   */
  private async sendViaEmail(data: NotificationData): Promise<{ success: boolean }> {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, name: true }
      })
      
      if (!user) return { success: false }
      
      await mailketingService.sendEmail({
        to: user.email,
        subject: data.title,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${data.title}</h2>
            <p>${data.message}</p>
            ${data.link ? `<p><a href="${data.link}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Lihat Detail</a></p>` : ''}
            <hr>
            <p style="color: #666; font-size: 12px;">Notifikasi dari EksporYuk</p>
          </div>
        `
      })
      
      return { success: true }
    } catch (error) {
      console.error('[NotificationService] Email error:', error)
      return { success: false }
    }
  }
  
  /**
   * Send via WhatsApp (Starsender)
   */
  private async sendViaWhatsApp(data: NotificationData): Promise<{ success: boolean }> {
    try {
      // Get user phone
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { whatsapp: true, phone: true, name: true }
      })
      
      if (!user || (!user.whatsapp && !user.phone)) return { success: false }
      
      const phone = user.whatsapp || user.phone!
      const message = `*${data.title}*\n\n${data.message}${data.link ? `\n\nLihat detail: ${data.link}` : ''}`
      
      await starsenderService.sendWhatsApp({
        to: phone,
        message
      })
      
      return { success: true }
    } catch (error) {
      console.error('[NotificationService] WhatsApp error:', error)
      return { success: false }
    }
  }
  
  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<any> {
    let preferences = await prisma.notificationPreference.findFirst({
      where: { userId }
    })
    
    // Create default preferences if not exist
    if (!preferences) {
      try {
        preferences = await prisma.notificationPreference.create({
          data: { 
            id: `notif_pref_${userId}_${Date.now()}`,
            userId,
            updatedAt: new Date()
          }
        })
      } catch (err) {
        // If creation fails (race condition), try to find again
        preferences = await prisma.notificationPreference.findFirst({
          where: { userId }
        })
      }
    }
    
    return preferences
  }
  
  /**
   * Check if notification type is enabled for user
   */
  private isNotificationTypeEnabled(preferences: any, type: NotificationType): boolean {
    if (!preferences) return true
    
    const mapping: Record<NotificationType, string> = {
      CHAT_MESSAGE: 'chatNotifications',
      COMMENT: 'commentNotifications',
      COMMENT_REPLY: 'commentNotifications',
      MENTION: 'commentNotifications', // Mention uses same preference as comments
      POST: 'postNotifications',
      COURSE_DISCUSSION: 'courseNotifications',
      EVENT_REMINDER: 'eventNotifications',
      TRANSACTION: 'transactionNotifications',
      FOLLOWER: 'followerNotifications',
      ACHIEVEMENT: 'achievementNotifications',
      SYSTEM: 'systemNotifications',
      AFFILIATE: 'affiliateNotifications',
      MEMBERSHIP: 'transactionNotifications',
      PRODUCT_REVIEW: 'postNotifications',
      CONTENT_UPDATE: 'systemNotifications'
    }
    
    const prefKey = mapping[type]
    return prefKey ? preferences[prefKey] !== false : true
  }
  
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  }
  
  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      
      return { success: true, count: result.count }
    } catch (error) {
      return { success: false, count: 0 }
    }
  }
  
  /**
   * Subscribe user to notifications for a target
   */
  async subscribe(
    userId: string,
    subscriptionType: string,
    targetId: string,
    preferences?: Partial<NotificationSubscription>
  ): Promise<{ success: boolean }> {
    try {
      await prisma.notificationSubscription.upsert({
        where: {
          userId_subscriptionType_targetId: {
            userId,
            subscriptionType,
            targetId
          }
        },
        create: {
          userId,
          subscriptionType,
          targetId,
          ...preferences
        },
        update: preferences || {}
      })
      
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  }
  
  /**
   * Unsubscribe user from notifications
   */
  async unsubscribe(
    userId: string,
    subscriptionType: string,
    targetId: string
  ): Promise<{ success: boolean }> {
    try {
      await prisma.notificationSubscription.delete({
        where: {
          userId_subscriptionType_targetId: {
            userId,
            subscriptionType,
            targetId
          }
        }
      })
      
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  }
  
  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      type?: NotificationType
      unreadOnly?: boolean
    }
  ): Promise<any[]> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(options?.type && { type: options.type }),
          ...(options?.unreadOnly && { isRead: false })
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0
      })
      
      return notifications
    } catch (error) {
      return []
    }
  }
  
  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    } catch (error) {
      return 0
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService
