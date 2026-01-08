/**
 * BRANDED PUSH NOTIFICATION HELPER
 * Helper untuk menggunakan branded templates Pusher & OneSignal
 */

import PusherNotificationTemplates from './pusher-notification-templates'
import OneSignalNotificationTemplates from './onesignal-notification-templates'
import { pusherService } from '@/lib/pusher'
import { oneSignalService } from '@/lib/onesignal'

interface BrandedPushData {
  userId: string
  userName: string
  feature: string
  action: string
  details?: string
  link?: string
  buttonText?: string
  buttonUrl?: string
  urgency?: 'low' | 'normal' | 'high'
  channels?: ('pusher' | 'onesignal')[]
}

export class BrandedPushNotificationHelper {
  
  /**
   * Send Bio Page Update Notifications
   */
  static async sendBioPageUpdate(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      // Send Pusher notification
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.bioPagUpdated({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      // Send OneSignal notification
      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.bioPageUpdated({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Bio page notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Challenge Joined Notifications
   */
  static async sendChallengeJoined(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.challengeJoined({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.challengeJoined({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Challenge joined notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Challenge Milestone Notifications
   */
  static async sendChallengeMilestone(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.challengeMilestone({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.challengeMilestone({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency || 'high'
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Challenge milestone notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Automation Created Notifications
   */
  static async sendAutomationCreated(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.automationCreated({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.automationCreated({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Automation created notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Automation Status Change Notifications
   */
  static async sendAutomationStatusChanged(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.automationStatusChanged({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.automationStatusChanged({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Automation status notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Lead Captured Notifications
   */
  static async sendLeadCaptured(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.leadCaptured({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.leadCaptured({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency || 'high'
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Lead captured notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Commission Earned Notifications
   */
  static async sendCommissionEarned(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.commissionEarned({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.commissionEarned({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency || 'high'
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Commission earned notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send System Update Notifications
   */
  static async sendSystemUpdate(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.systemUpdate({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.systemUpdate({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] System update notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Training Available Notifications
   */
  static async sendTrainingAvailable(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.trainingAvailable({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        const oneSignalTemplate = OneSignalNotificationTemplates.trainingAvailable({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText,
          buttonUrl: data.buttonUrl,
          urgency: data.urgency
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Training available notification error:', error)
      return { success: false, error, results }
    }
  }

  /**
   * Send Performance Alert Notifications
   */
  static async sendPerformanceAlert(data: BrandedPushData) {
    const channels = data.channels || ['pusher', 'onesignal']
    const results: any[] = []

    try {
      if (channels.includes('pusher')) {
        const pusherTemplate = PusherNotificationTemplates.performanceAlert({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link
        })
        pusherTemplate.userId = data.userId

        const pusherResult = await pusherService.trigger(
          `user-${data.userId}`,
          'notification',
          pusherTemplate
        )
        results.push({ channel: 'pusher', success: pusherResult })
      }

      if (channels.includes('onesignal')) {
        // Performance alerts always high urgency
        const oneSignalTemplate = OneSignalNotificationTemplates.systemUpdate({
          userName: data.userName,
          feature: data.feature,
          action: data.action,
          details: data.details,
          link: data.link,
          buttonText: data.buttonText || 'Lihat Analytics',
          buttonUrl: data.buttonUrl || data.link,
          urgency: 'high'
        })

        const oneSignalResult = await oneSignalService.sendToUser(
          data.userId,
          oneSignalTemplate
        )
        results.push({ channel: 'onesignal', success: oneSignalResult.success })
      }

      return { success: true, results }
    } catch (error) {
      console.error('[BrandedPush] Performance alert notification error:', error)
      return { success: false, error, results }
    }
  }
}

export default BrandedPushNotificationHelper