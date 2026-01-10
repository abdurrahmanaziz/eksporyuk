/**
 * AUTO NOTIFICATION TRIGGER SERVICE
 * Service untuk trigger auto notifications berdasarkan event
 */

import { prisma } from '@/lib/prisma'
import { oneSignalService } from '@/lib/onesignal'

export type AutoNotificationTrigger = 
  | 'welcome'
  | 'subscription'
  | 'course_enrolled'
  | 'course_complete'
  | 'payment_success'
  | 'payment_pending'
  | 'inactive_7d'
  | 'inactive_30d'
  | 'membership_expiring'
  | 'birthday'

interface TriggerContext {
  userId: string
  userName?: string
  userEmail?: string
  courseName?: string
  productName?: string
  amount?: number
  membershipTier?: string
  expiryDate?: Date
  [key: string]: any
}

/**
 * Trigger auto notification untuk user tertentu
 */
export async function triggerAutoNotification(
  trigger: AutoNotificationTrigger,
  context: TriggerContext
): Promise<{ success: boolean; sent: number; error?: string }> {
  try {
    // Get all auto notifications for this trigger
    const activeAutoNotifs = await prisma.oneSignalAutoNotification.findMany({
      where: {
        trigger,
        enabled: true
      }
    })

    if (activeAutoNotifs.length === 0) {
      return { success: true, sent: 0 }
    }

    // Get user data using raw query for oneSignalPlayerId
    const userResult = await prisma.$queryRaw<Array<any>>`
      SELECT id, name, email, oneSignalPlayerId, province, city, role 
      FROM User 
      WHERE id = ${context.userId}
      LIMIT 1
    `

    const user = userResult[0]

    if (!user || !user.oneSignalPlayerId) {
      console.log(`[AutoNotif] User ${context.userId} not subscribed to OneSignal`)
      return { success: true, sent: 0 }
    }

    let sentCount = 0

    for (const autoNotif of activeAutoNotifs) {
      // Process template variables
      const title = processTemplate(autoNotif.title, {
        ...context,
        name: context.userName || user.name || 'User',
        email: context.userEmail || user.email || ''
      })

      const message = processTemplate(autoNotif.message, {
        ...context,
        name: context.userName || user.name || 'User',
        email: context.userEmail || user.email || ''
      })

      // If delay is set, schedule for later (simplified - in production use a job queue)
      if (autoNotif.delayMinutes > 0) {
        // Store scheduled notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `[Scheduled] ${title}`,
            message,
            type: 'SYSTEM',
            metadata: {
              scheduledFor: new Date(Date.now() + autoNotif.delayMinutes * 60000).toISOString(),
              autoNotifId: autoNotif.id,
              trigger,
              onesignal: true
            }
          }
        })
        console.log(`[AutoNotif] Scheduled notification for user ${user.id} in ${autoNotif.delayMinutes} minutes`)
      } else {
        // Send immediately
        const result = await oneSignalService.sendToUser(
          user.id,
          title,
          message,
          autoNotif.url || undefined
        )

        if (result.success) {
          sentCount++
          
          // Log notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: `[OneSignal Auto] ${title}`,
              message,
              type: 'SYSTEM',
              metadata: {
                autoNotifId: autoNotif.id,
                trigger,
                onesignal: true
              }
            }
          })
        }
      }
    }

    return { success: true, sent: sentCount }
  } catch (error: any) {
    console.error('[AutoNotif] Error:', error)
    return { success: false, sent: 0, error: error.message }
  }
}

/**
 * Process template variables in string
 */
function processTemplate(template: string, context: Record<string, any>): string {
  let result = template

  // Replace {variable} patterns
  const pattern = /\{(\w+)\}/g
  result = result.replace(pattern, (match, key) => {
    if (context[key] !== undefined && context[key] !== null) {
      return String(context[key])
    }
    return match // Keep original if not found
  })

  return result
}

/**
 * Helper functions for common triggers
 */

export async function triggerWelcomeNotification(userId: string, userName?: string) {
  return triggerAutoNotification('welcome', { userId, userName })
}

export async function triggerSubscriptionNotification(
  userId: string, 
  membershipTier: string
) {
  return triggerAutoNotification('subscription', { userId, membershipTier })
}

export async function triggerCourseEnrolledNotification(
  userId: string,
  courseName: string
) {
  return triggerAutoNotification('course_enrolled', { userId, courseName })
}

export async function triggerCourseCompleteNotification(
  userId: string,
  courseName: string
) {
  return triggerAutoNotification('course_complete', { userId, courseName })
}

export async function triggerPaymentSuccessNotification(
  userId: string,
  productName: string,
  amount: number
) {
  return triggerAutoNotification('payment_success', { userId, productName, amount })
}

export async function triggerPaymentPendingNotification(
  userId: string,
  productName: string,
  amount: number
) {
  return triggerAutoNotification('payment_pending', { userId, productName, amount })
}

export async function triggerMembershipExpiringNotification(
  userId: string,
  membershipTier: string,
  expiryDate: Date
) {
  return triggerAutoNotification('membership_expiring', { 
    userId, 
    membershipTier, 
    expiryDate,
    daysLeft: Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  })
}

export default {
  triggerAutoNotification,
  triggerWelcomeNotification,
  triggerSubscriptionNotification,
  triggerCourseEnrolledNotification,
  triggerCourseCompleteNotification,
  triggerPaymentSuccessNotification,
  triggerPaymentPendingNotification,
  triggerMembershipExpiringNotification
}
