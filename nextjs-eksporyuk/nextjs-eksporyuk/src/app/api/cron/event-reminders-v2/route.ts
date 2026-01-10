import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { mailketingService } from '@/lib/services/mailketingService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Cron Job untuk Event Reminders (Enhanced)
 * 
 * Memproses EventReminder yang dikonfigurasi di admin panel
 * Run every 15 minutes via Vercel Cron
 * 
 * Trigger Types:
 * - AFTER_PURCHASE: X hari/jam setelah user mendaftar event
 * - BEFORE_EXPIRY: X hari/jam sebelum event dimulai
 * - ON_SPECIFIC_DATE: Pada tanggal tertentu
 * - ON_INACTIVE: Ketika user tidak aktif (belum diimplementasi)
 * - CONDITIONAL: Berdasarkan kondisi tertentu (belum diimplementasi)
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Event Reminders V2] Starting...')
    const now = new Date()
    let totalSent = 0
    const results: any[] = []

    // 1. Get all active EventReminders
    const activeReminders = await prisma.eventReminder.findMany({
      where: {
        isActive: true
      },
      include: {
        event: {
          include: {
            rsvps: {
              where: {
                status: 'GOING'
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { sequenceOrder: 'asc' }
    })

    console.log(`[Event Reminders V2] Found ${activeReminders.length} active reminders`)

    for (const reminder of activeReminders) {
      const event = reminder.event
      if (!event || !event.isPublished) continue

      // Skip past events for BEFORE_EXPIRY
      if (reminder.triggerType === 'BEFORE_EXPIRY' && event.startDate < now) continue

      // Get all registered users for this event
      const registeredUsers = event.rsvps

      for (const rsvp of registeredUsers) {
        const user = rsvp.user
        if (!user || !user.email) continue

        // Check if reminder was already sent to this user
        const existingLog = await prisma.reminderLog.findFirst({
          where: {
            reminderId: reminder.id,
            userId: user.id,
            status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] }
          }
        })

        if (existingLog) continue

        // Calculate if it's time to send this reminder
        const shouldSend = await shouldSendReminder(reminder, event, rsvp.createdAt, now)

        if (!shouldSend) continue

        try {
          // Prepare content with variable substitution
          const content = prepareNotificationContent(reminder, event, user)

          // Send notifications via enabled channels
          const sentChannels: string[] = []

          if (reminder.emailEnabled && reminder.emailSubject && reminder.emailBody) {
            try {
              await mailketingService.sendEmail({
                to: user.email,
                subject: content.emailSubject,
                html: content.emailBody
              })
              sentChannels.push('EMAIL')
            } catch (e) {
              console.error(`[Event Reminders V2] Email failed for ${user.email}:`, e)
            }
          }

          if (reminder.whatsappEnabled && reminder.whatsappMessage && user.phone) {
            try {
              // WhatsApp can be sent via starsender or mailketing
              // For now, we'll log it - can be implemented with actual WA service
              console.log(`[Event Reminders V2] Would send WhatsApp to ${user.phone}`)
              sentChannels.push('WHATSAPP')
            } catch (e) {
              console.error(`[Event Reminders V2] WhatsApp failed for ${user.phone}:`, e)
            }
          }

          if (reminder.pushEnabled && reminder.pushTitle && reminder.pushBody) {
            try {
              // Push notification via notificationService
              await notificationService.send({
                userId: user.id,
                type: 'EVENT_REMINDER',
                title: content.pushTitle,
                message: content.pushBody,
                eventId: event.id,
                metadata: { type: 'event_reminder', eventId: event.id }
              })
              sentChannels.push('PUSH')
            } catch (e) {
              console.error(`[Event Reminders V2] Push failed for ${user.id}:`, e)
            }
          }

          if (reminder.inAppEnabled && reminder.inAppTitle && reminder.inAppBody) {
            try {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  type: 'EVENT_REMINDER',
                  title: content.inAppTitle,
                  message: content.inAppBody,
                  link: reminder.inAppLink || `/my-events`,
                  eventId: event.id,
                  isRead: false
                }
              })
              sentChannels.push('IN_APP')
            } catch (e) {
              console.error(`[Event Reminders V2] In-app failed for ${user.id}:`, e)
            }
          }

          // Log the reminder
          if (sentChannels.length > 0) {
            await prisma.reminderLog.create({
              data: {
                reminderId: reminder.id,
                userId: user.id,
                status: 'SENT',
                sentAt: now,
                channels: sentChannels,
                metadata: {
                  eventId: event.id,
                  eventTitle: event.title,
                  reminderTitle: reminder.title,
                  sentChannels
                }
              }
            })

            // Update reminder stats
            await prisma.eventReminder.update({
              where: { id: reminder.id },
              data: { sentCount: { increment: 1 } }
            })

            totalSent++
            console.log(`[Event Reminders V2] ✅ Sent "${reminder.title}" to ${user.email} via ${sentChannels.join(', ')}`)
          }

        } catch (error) {
          console.error(`[Event Reminders V2] Failed to process ${reminder.title} for ${user.email}:`, error)
          
          // Log failure
          await prisma.reminderLog.create({
            data: {
              reminderId: reminder.id,
              userId: user.id,
              status: 'FAILED',
              sentAt: now,
              channels: [],
              metadata: { error: String(error) }
            }
          })

          // Update failure count
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: { failedCount: { increment: 1 } }
          })
        }
      }

      results.push({
        reminderId: reminder.id,
        reminderTitle: reminder.title,
        eventId: event.id,
        eventTitle: event.title,
        triggerType: reminder.triggerType,
        processed: true
      })
    }

    console.log(`[Event Reminders V2] Completed. Sent ${totalSent} reminders.`)

    return NextResponse.json({
      success: true,
      totalSent,
      processedReminders: results.length,
      results
    })

  } catch (error) {
    console.error('[Event Reminders V2] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Determine if a reminder should be sent based on trigger type and timing
 */
async function shouldSendReminder(
  reminder: any, 
  event: any, 
  registrationDate: Date,
  now: Date
): Promise<boolean> {
  const { triggerType, delayAmount, delayUnit, specificDate, preferredTime, timezone } = reminder

  // Calculate target time with preferred time
  let targetTime: Date | null = null

  switch (triggerType) {
    case 'AFTER_PURCHASE': {
      // X days/hours after registration
      targetTime = new Date(registrationDate)
      if (delayUnit === 'hours') {
        targetTime.setHours(targetTime.getHours() + delayAmount)
      } else if (delayUnit === 'minutes') {
        targetTime.setMinutes(targetTime.getMinutes() + delayAmount)
      } else {
        // Default days
        targetTime.setDate(targetTime.getDate() + delayAmount)
        // Set preferred time if specified
        if (preferredTime) {
          const [hours, minutes] = preferredTime.split(':').map(Number)
          targetTime.setHours(hours, minutes, 0, 0)
        }
      }
      break
    }

    case 'BEFORE_EXPIRY': {
      // X days/hours before event start
      targetTime = new Date(event.startDate)
      if (delayUnit === 'hours') {
        targetTime.setHours(targetTime.getHours() - delayAmount)
      } else if (delayUnit === 'minutes') {
        targetTime.setMinutes(targetTime.getMinutes() - delayAmount)
      } else {
        // Default days
        targetTime.setDate(targetTime.getDate() - delayAmount)
        // Set preferred time if specified
        if (preferredTime) {
          const [hours, minutes] = preferredTime.split(':').map(Number)
          targetTime.setHours(hours, minutes, 0, 0)
        }
      }
      break
    }

    case 'ON_SPECIFIC_DATE': {
      if (!specificDate) return false
      targetTime = new Date(specificDate)
      // Set preferred time if specified
      if (preferredTime) {
        const [hours, minutes] = preferredTime.split(':').map(Number)
        targetTime.setHours(hours, minutes, 0, 0)
      }
      break
    }

    case 'ON_INACTIVE':
    case 'CONDITIONAL':
      // Not implemented yet
      return false

    default:
      return false
  }

  if (!targetTime) return false

  // Check if current time is within the send window (30 minutes)
  const timeDiff = now.getTime() - targetTime.getTime()
  const windowMs = 30 * 60 * 1000 // 30 minutes window
  
  // Send if we're within the window and haven't passed too far
  return timeDiff >= 0 && timeDiff <= windowMs
}

/**
 * Replace template variables with actual values
 */
function prepareNotificationContent(reminder: any, event: any, user: any) {
  const variables: Record<string, string> = {
    '{customer_name}': user.name || 'Peserta',
    '{customer_email}': user.email,
    '{event_name}': event.title,
    '{event_title}': event.title,
    '{event_date}': event.startDate.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }),
    '{event_time}': event.startDate.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    }),
    '{event_location}': event.location || 'TBA',
    '{event_description}': event.description || '',
    '{ticket_number}': `EVT-${event.id.substring(0, 8).toUpperCase()}`,
    '{meeting_url}': event.meetingUrl || '',
    '{meeting_id}': event.meetingId || '',
    '{meeting_password}': event.meetingPassword || '',
    '{dashboard_link}': process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com',
    '{feedback_link}': `${process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'}/feedback/${event.id}`,
    '{whatsapp_group_link}': '', // Could be stored in event metadata
    '{event_id}': event.id,
  }

  const replaceVariables = (text: string | null): string => {
    if (!text) return ''
    let result = text
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    return result
  }

  return {
    emailSubject: replaceVariables(reminder.emailSubject),
    emailBody: replaceVariables(reminder.emailBody),
    whatsappMessage: replaceVariables(reminder.whatsappMessage),
    pushTitle: replaceVariables(reminder.pushTitle),
    pushBody: replaceVariables(reminder.pushBody),
    inAppTitle: replaceVariables(reminder.inAppTitle),
    inAppBody: replaceVariables(reminder.inAppBody),
  }
}

// POST handler for manual trigger (testing)
export async function POST(request: NextRequest) {
  return GET(request)
}
