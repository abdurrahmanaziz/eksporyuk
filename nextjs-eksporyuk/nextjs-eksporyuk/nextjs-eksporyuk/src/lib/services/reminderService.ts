/**
 * REMINDER SERVICE (PRD v7.3)
 * Handles scheduling and sending of automated reminders
 * Integrates with notification service for multi-channel delivery
 */

import { prisma } from '@/lib/prisma'
import { notificationService } from './notificationService'
import { mailketingService } from '@/lib/mailketing'
import { starsenderService } from '@/lib/starsender'
import { ReminderTrigger, ReminderStatus, ReminderChannel } from '@prisma/client'

interface ReminderConfig {
  reminderId: string
  userId: string
  channel: ReminderChannel
  content: {
    subject?: string
    body: string
    cta?: string
    ctaLink?: string
    icon?: string
  }
  metadata?: Record<string, any>
}

interface VariableMap {
  [key: string]: string | number | null | undefined
}

class ReminderService {
  /**
   * Process and send a single reminder
   */
  async sendReminder(config: ReminderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          reminderId: config.reminderId,
          userId: config.userId,
          channel: config.channel,
          status: 'PENDING',
          scheduledAt: new Date(),
          subject: config.content.subject,
          body: config.content.body,
          ctaLink: config.content.ctaLink,
        },
      })

      let success = false
      let errorMessage: string | undefined

      // Send based on channel
      switch (config.channel) {
        case 'EMAIL':
          const emailResult = await this.sendEmailReminder(config)
          success = emailResult.success
          errorMessage = emailResult.error
          break

        case 'WHATSAPP':
          const waResult = await this.sendWhatsAppReminder(config)
          success = waResult.success
          errorMessage = waResult.error
          break

        case 'PUSH':
          const pushResult = await this.sendPushReminder(config)
          success = pushResult.success
          errorMessage = pushResult.error
          break

        case 'IN_APP':
          const inAppResult = await this.sendInAppReminder(config)
          success = inAppResult.success
          errorMessage = inAppResult.error
          break

        default:
          errorMessage = `Unknown channel: ${config.channel}`
      }

      // Update log status
      await prisma.reminderLog.update({
        where: { id: log.id },
        data: {
          status: success ? 'SENT' : 'FAILED',
          sentAt: success ? new Date() : null,
          failedAt: success ? null : new Date(),
          errorMessage,
        },
      })

      // Update reminder statistics - try all reminder types
      // since we don't know which type the reminder is from
      const incrementField = success ? 'sentCount' : 'failedCount'
      try {
        // Try membership reminder first
        await prisma.membershipReminder.update({
          where: { id: config.reminderId },
          data: { [incrementField]: { increment: 1 } },
        })
      } catch {
        try {
          // Try course reminder
          await prisma.courseReminder.update({
            where: { id: config.reminderId },
            data: { [incrementField]: { increment: 1 } },
          })
        } catch {
          try {
            // Try event reminder
            await prisma.eventReminder.update({
              where: { id: config.reminderId },
              data: { [incrementField]: { increment: 1 } },
            })
          } catch {
            try {
              // Try product reminder
              await prisma.productReminder.update({
                where: { id: config.reminderId },
                data: { [incrementField]: { increment: 1 } },
              })
            } catch {
              // Ignore if reminder not found in any table - stats update is optional
              console.log(`[ReminderService] Could not update stats for reminder ${config.reminderId}`)
            }
          }
        }
      }

      return { success, error: errorMessage }
    } catch (error: any) {
      console.error('[ReminderService] Send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send email reminder via Mailketing with branded template
   */
  private async sendEmailReminder(config: ReminderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: config.userId },
        select: { email: true, name: true },
      })

      if (!user?.email) {
        return { success: false, error: 'User email not found' }
      }

      // Import branded email generator
      const { generateBrandedEmail } = await import('@/lib/reminder-templates')
      
      // Generate branded HTML email with logo header and footer
      const htmlBody = generateBrandedEmail({
        title: config.content.subject || 'Reminder dari EksporYuk',
        greeting: `Halo ${user.name || 'Member'}!`,
        body: config.content.body,
        ctaText: config.content.cta,
        ctaLink: config.content.ctaLink,
      })

      await mailketingService.sendEmail({
        to: user.email,
        subject: config.content.subject || 'Reminder dari EksporYuk',
        body: htmlBody,
      })

      return { success: true }
    } catch (error: any) {
      console.error('[ReminderService] Email send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send WhatsApp reminder via Starsender
   */
  private async sendWhatsAppReminder(config: ReminderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: config.userId },
        select: { whatsapp: true, phone: true, name: true },
      })

      const phone = user?.whatsapp || user?.phone
      if (!phone) {
        return { success: false, error: 'User phone not found' }
      }

      let message = config.content.body
      if (config.content.cta && config.content.ctaLink) {
        message += `\n\n${config.content.cta}: ${config.content.ctaLink}`
      }

      await starsenderService.sendWhatsApp({
        to: phone,
        message,
      })

      return { success: true }
    } catch (error: any) {
      console.error('[ReminderService] WhatsApp send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send push notification via OneSignal
   */
  private async sendPushReminder(config: ReminderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await notificationService.send({
        userId: config.userId,
        type: 'MEMBERSHIP',
        title: config.content.subject || 'Reminder',
        message: config.content.body,
        link: config.content.ctaLink,
        icon: config.content.icon,
        channels: ['onesignal'],
        sourceType: 'REMINDER',
        sourceId: config.reminderId,
        metadata: config.metadata,
      })

      return { success: result.success, error: result.error }
    } catch (error: any) {
      console.error('[ReminderService] Push send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send in-app notification via Pusher
   */
  private async sendInAppReminder(config: ReminderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await notificationService.send({
        userId: config.userId,
        type: 'MEMBERSHIP',
        title: config.content.subject || 'Reminder',
        message: config.content.body,
        link: config.content.ctaLink,
        icon: config.content.icon,
        channels: ['pusher'],
        sourceType: 'REMINDER',
        sourceId: config.reminderId,
        metadata: config.metadata,
      })

      return { success: result.success, error: result.error }
    } catch (error: any) {
      console.error('[ReminderService] In-app send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Substitute variables in reminder content
   */
  substituteVariables(template: string, variables: VariableMap): string {
    if (!template) return template

    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(placeholder, String(value ?? ''))
    })

    return result
  }

  /**
   * Calculate next send time based on trigger type
   */
  calculateNextSendTime(
    triggerType: ReminderTrigger,
    delayAmount: number,
    delayUnit: string,
    referenceDate: Date,
    specificDate?: Date
  ): Date | null {
    let sendTime: Date

    switch (triggerType) {
      case 'AFTER_PURCHASE':
        sendTime = this.addTime(referenceDate, delayAmount, delayUnit)
        break

      case 'BEFORE_EXPIRY':
        sendTime = this.subtractTime(referenceDate, delayAmount, delayUnit)
        break

      case 'ON_SPECIFIC_DATE':
        if (!specificDate) return null
        sendTime = specificDate
        break

      case 'ON_INACTIVE':
        // Would need activity tracking
        return null

      case 'CONDITIONAL':
        // Would need condition evaluation
        return null

      default:
        return null
    }

    return sendTime
  }

  /**
   * Add time to a date
   */
  private addTime(date: Date, amount: number, unit: string): Date {
    const newDate = new Date(date)

    switch (unit) {
      case 'minutes':
        newDate.setMinutes(newDate.getMinutes() + amount)
        break
      case 'hours':
        newDate.setHours(newDate.getHours() + amount)
        break
      case 'days':
        newDate.setDate(newDate.getDate() + amount)
        break
      case 'weeks':
        newDate.setDate(newDate.getDate() + amount * 7)
        break
      case 'months':
        newDate.setMonth(newDate.getMonth() + amount)
        break
    }

    return newDate
  }

  /**
   * Subtract time from a date
   */
  private subtractTime(date: Date, amount: number, unit: string): Date {
    return this.addTime(date, -amount, unit)
  }

  /**
   * Check if reminder was already sent to user
   */
  async wasAlreadySent(reminderId: string, userId: string): Promise<boolean> {
    const existingLog = await prisma.reminderLog.findFirst({
      where: {
        reminderId,
        userId,
        status: { in: ['SENT', 'DELIVERED'] },
      },
    })

    return !!existingLog
  }

  /**
   * Get pending reminders for processing
   */
  async getPendingReminders(membershipId?: string) {
    const where: any = {
      isActive: true,
    }

    if (membershipId) {
      where.membershipId = membershipId
    }

    return prisma.membershipReminder.findMany({
      where,
      include: {
        membership: true,
      },
      orderBy: { sequenceOrder: 'asc' },
    })
  }

  /**
   * Get reminder statistics
   */
  async getStatistics(reminderId: string) {
    const reminder = await prisma.membershipReminder.findUnique({
      where: { id: reminderId },
      select: {
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        failedCount: true,
      },
    })

    if (!reminder) return null

    const totalSent = reminder.sentCount
    const deliveryRate = totalSent > 0 ? (reminder.deliveredCount / totalSent) * 100 : 0
    const openRate = totalSent > 0 ? (reminder.openedCount / totalSent) * 100 : 0
    const clickRate = totalSent > 0 ? (reminder.clickedCount / totalSent) * 100 : 0

    return {
      ...reminder,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    }
  }

  /**
   * Track reminder interaction (delivered, opened, clicked)
   */
  async trackInteraction(
    logId: string,
    interaction: 'delivered' | 'opened' | 'clicked'
  ): Promise<void> {
    const now = new Date()
    const updateData: any = {}

    switch (interaction) {
      case 'delivered':
        updateData.status = 'DELIVERED'
        updateData.deliveredAt = now
        break
      case 'opened':
        updateData.status = 'OPENED'
        updateData.openedAt = now
        break
      case 'clicked':
        updateData.status = 'CLICKED'
        updateData.clickedAt = now
        break
    }

    const log = await prisma.reminderLog.update({
      where: { id: logId },
      data: updateData,
    })

    // Update reminder statistics
    const incrementField = `${interaction}Count`
    await prisma.membershipReminder.update({
      where: { id: log.reminderId },
      data: { [incrementField]: { increment: 1 } },
    })
  }
}

export const reminderService = new ReminderService()
export default reminderService
