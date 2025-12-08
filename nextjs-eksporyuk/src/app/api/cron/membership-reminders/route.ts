import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { pusherService } from '@/lib/pusher'

/**
 * Membership Reminder Cron Job
 * Triggers automated reminders based on membership status and configured sequences
 * 
 * Triggers:
 * - AFTER_PURCHASE: X days/hours after membership purchase
 * - BEFORE_EXPIRY: X days/hours before membership expiration
 * - ON_SPECIFIC_DATE: On a specific calendar date
 * - CONDITIONAL: Based on user conditions
 * 
 * Called via: Vercel Cron, external scheduler, or manual endpoint
 * Authorization: Uses CRON_SECRET env variable
 * 
 * @route GET /api/cron/membership-reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Membership Reminders] Starting cron job')

    let processedReminders = 0
    let sentNotifications = 0
    let failedNotifications = 0

    // Get all active reminders
    const reminders = await prisma.membershipReminder.findMany({
      where: { isActive: true },
      include: {
        membership: true,
      },
    })

    console.log(`[Membership Reminders] Found ${reminders.length} active reminders to process`)

    const now = new Date()

    // Process each reminder
    for (const reminder of reminders) {
      try {
        // Get all active memberships for this plan
        const userMemberships = await prisma.userMembership.findMany({
          where: {
            membershipId: reminder.membershipId,
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        })

        console.log(
          `[Membership Reminders] Processing reminder "${reminder.title}" for ${userMemberships.length} users`
        )

        // Check each user membership against this reminder
        for (const userMembership of userMemberships) {
          try {
            // Calculate when this reminder should be sent
            const sendTime = calculateSendTime(reminder, userMembership)

            if (!sendTime) {
              continue // Skip if conditions not met
            }

            // Check if we're within sending window (allow ±15 min buffer)
            const timeDiff = Math.abs(now.getTime() - sendTime.getTime())
            const bufferMs = 15 * 60 * 1000 // 15 minutes

            if (timeDiff > bufferMs) {
              continue // Not time yet or already sent
            }

            // Check if already sent (via ReminderLog)
            const existingLog = await prisma.reminderLog.findFirst({
              where: {
                reminderId: reminder.id,
                userId: userMembership.userId,
                status: { in: ['SENT', 'DELIVERED'] },
              },
            })

            if (existingLog) {
              continue // Already sent to this user
            }

            // Create reminder log entry
            const reminderLog = await prisma.reminderLog.create({
              data: {
                reminderId: reminder.id,
                userId: userMembership.userId,
                channel: 'IN_APP', // Primary channel - logs can track others via metadata
                status: 'PENDING',
                scheduledAt: now,
              },
            })

            // Prepare notification content
            const notificationContent = prepareNotificationContent(
              reminder,
              userMembership,
              userMembership.user
            )

            // Send via configured channels
            const channels: Array<'pusher' | 'onesignal' | 'email' | 'whatsapp'> = []

            if (reminder.emailEnabled) channels.push('email')
            if (reminder.whatsappEnabled) channels.push('whatsapp')
            if (reminder.pushEnabled) channels.push('onesignal')
            if (reminder.inAppEnabled) channels.push('pusher')

            // Send unified notification
            try {
              const result = await notificationService.send({
                userId: userMembership.userId,
                type: 'MEMBERSHIP',
                title: notificationContent.pushTitle || reminder.title,
                message: notificationContent.pushBody || notificationContent.emailBody || reminder.description,
                sourceType: 'MEMBERSHIP_REMINDER',
                sourceId: reminder.id,
                link: notificationContent.pushClickAction || notificationContent.emailCTALink,
                image: notificationContent.pushIcon,
                channels,
                metadata: {
                  reminderId: reminder.id,
                  membershipId: reminder.membershipId,
                  reminderTitle: reminder.title,
                },
              })

              if (result.success && result.notificationId && result.notificationId !== 'skipped') {
                // Update reminder log
                await prisma.reminderLog.update({
                  where: { id: reminderLog.id },
                  data: {
                    status: 'SENT',
                    sentAt: now,
                  },
                })

                // Update reminder statistics
                await prisma.membershipReminder.update({
                  where: { id: reminder.id },
                  data: { sentCount: { increment: 1 } },
                })

                sentNotifications++
              } else {
                // Failed or skipped
                await prisma.reminderLog.update({
                  where: { id: reminderLog.id },
                  data: {
                    status: 'FAILED',
                    failedAt: now,
                    errorMessage: result.error || 'Unknown error',
                  },
                })

                await prisma.membershipReminder.update({
                  where: { id: reminder.id },
                  data: { failedCount: { increment: 1 } },
                })

                failedNotifications++
              }
            } catch (error) {
              console.error(
                `[Membership Reminders] Notification send failed for user ${userMembership.userId}:`,
                error
              )

              await prisma.reminderLog.update({
                where: { id: reminderLog.id },
                data: {
                  status: 'FAILED',
                  failedAt: now,
                  errorMessage: String(error),
                },
              })

              failedNotifications++
            }
          } catch (error) {
            console.error(
              `[Membership Reminders] Error processing reminder for user ${userMembership.userId}:`,
              error
            )
            failedNotifications++
          }
        }

        processedReminders++
      } catch (error) {
        console.error(`[Membership Reminders] Error processing reminder ${reminder.id}:`, error)
      }
    }

    console.log('[Membership Reminders] Cron job completed', {
      processedReminders,
      sentNotifications,
      failedNotifications,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Cron job completed',
        stats: {
          processedReminders,
          sentNotifications,
          failedNotifications,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Membership Reminders] Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Calculate when a reminder should be sent for a specific user membership
 */
function calculateSendTime(
  reminder: any,
  userMembership: any
): Date | null {
  const now = new Date()
  let baseDate: Date
  let sendTime: Date

  switch (reminder.triggerType) {
    case 'AFTER_PURCHASE':
      // Trigger X days/hours after membership started
      baseDate = new Date(userMembership.startDate)
      sendTime = addTime(baseDate, reminder.delayAmount, reminder.delayUnit)
      break

    case 'BEFORE_EXPIRY':
      // Trigger X days/hours before membership expires
      baseDate = new Date(userMembership.endDate)
      sendTime = subtractTime(baseDate, reminder.delayAmount, reminder.delayUnit)
      break

    case 'ON_SPECIFIC_DATE':
      // Trigger on specific calendar date
      if (!reminder.specificDate) return null
      baseDate = new Date(reminder.specificDate)
      sendTime = baseDate
      break

    case 'CONDITIONAL':
      // For conditional reminders, need more complex logic
      // For now, skip
      return null

    default:
      return null
  }

  // Apply preferred time if specified
  if (reminder.preferredTime) {
    const [hours, minutes] = reminder.preferredTime.split(':').map(Number)
    sendTime.setHours(hours, minutes, 0, 0)
  }

  // Apply timezone
  if (reminder.timezone && reminder.timezone !== 'UTC') {
    // Adjust for timezone (simplified - would need proper conversion)
    const offset = getTimezoneOffset(reminder.timezone)
    sendTime = new Date(sendTime.getTime() + offset * 60 * 1000)
  }

  // Check day of week restrictions
  if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
    const dayOfWeek = sendTime.getDay()
    // Convert JS day (0=Sun) to ISO day (1=Mon)
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek

    if (!reminder.daysOfWeek.includes(isoDay)) {
      // Not a scheduled day - move to next allowed day
      return null
    }
  }

  // Check weekend avoidance
  if (reminder.avoidWeekends) {
    const dayOfWeek = sendTime.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Is weekend - move to next weekday
      return null
    }
  }

  return sendTime
}

/**
 * Prepare notification content with variable substitution
 */
function prepareNotificationContent(
  reminder: any,
  userMembership: any,
  user: any
) {
  const variables = {
    name: user.name || 'Member',
    email: user.email,
    phone: user.phone,
    plan_name: reminder.membership?.name,
    expiry_date: new Date(userMembership.endDate).toLocaleDateString('id-ID'),
    days_left: Math.ceil(
      (new Date(userMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
    payment_link: `${process.env.NEXT_PUBLIC_APP_URL}/memberships/renew/${userMembership.id}`,
    group_link: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK || '#',
    course_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses`,
    dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }

  const substituteVars = (text: string) => {
    if (!text) return text
    let result = text

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      if (value !== null && value !== undefined) {
        result = result.replace(new RegExp(placeholder, 'g'), String(value))
      }
    })

    return result
  }

  return {
    emailSubject: substituteVars(reminder.emailSubject),
    emailBody: substituteVars(reminder.emailBody),
    emailCTA: substituteVars(reminder.emailCTA),
    emailCTALink: substituteVars(reminder.emailCTALink),
    whatsappMessage: substituteVars(reminder.whatsappMessage),
    whatsappCTA: substituteVars(reminder.whatsappCTA),
    whatsappCTALink: substituteVars(reminder.whatsappCTALink),
    pushTitle: substituteVars(reminder.pushTitle),
    pushBody: substituteVars(reminder.pushBody),
    pushIcon: reminder.pushIcon,
    pushClickAction: substituteVars(reminder.pushClickAction),
    inAppTitle: substituteVars(reminder.inAppTitle),
    inAppBody: substituteVars(reminder.inAppBody),
    inAppLink: substituteVars(reminder.inAppLink),
  }
}

/**
 * Add time to a date
 */
function addTime(date: Date, amount: number, unit: string): Date {
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
  }

  return newDate
}

/**
 * Subtract time from a date
 */
function subtractTime(date: Date, amount: number, unit: string): Date {
  return addTime(date, -amount, unit)
}

/**
 * Get timezone offset in minutes
 */
function getTimezoneOffset(timezone: string): number {
  const timezoneOffsets: Record<string, number> = {
    'Asia/Jakarta': -420, // WIB (UTC-7, but stored as offset for subtract)
    'Asia/Makassar': -480, // WITA (UTC-8)
    'Asia/Jayapura': -540, // WIT (UTC-9)
    'UTC': 0,
  }

  return timezoneOffsets[timezone] || 0
}
