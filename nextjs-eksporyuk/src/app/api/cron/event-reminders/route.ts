import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

// Cron job untuk send event reminders
// Akan dijalankan setiap 30 menit via Vercel Cron atau external scheduler

const REMINDER_INTERVALS = {
  '7_DAYS': { days: 7, field: 'reminderSent7Days' },
  '3_DAYS': { days: 3, field: 'reminderSent3Days' },
  '1_DAY': { days: 1, field: 'reminderSent1Day' },
  '1_HOUR': { hours: 1, field: 'reminderSent1Hour' },
  '15_MINUTES': { minutes: 15, field: 'reminderSent15Min' }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Event Reminders Cron] Starting...')

    const now = new Date()
    let totalSent = 0
    const results: any[] = []

    // Get all upcoming events with products that have event notifications enabled
    const upcomingEvents = await prisma.product.findMany({
      where: {
        type: 'EVENT',
        eventDate: { gte: now },
        isActive: true
      },
      include: {
        userProducts: {
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
    })

    console.log(`[Event Reminders] Found ${upcomingEvents.length} upcoming events`)

    for (const event of upcomingEvents) {
      if (!event.eventDate) continue

      const eventTime = new Date(event.eventDate)
      const timeDiff = eventTime.getTime() - now.getTime()

      // Calculate time differences
      const diffMinutes = Math.floor(timeDiff / (1000 * 60))
      const diffHours = Math.floor(timeDiff / (1000 * 60 * 60))
      const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

      // Determine which reminder to send
      let reminderType: keyof typeof REMINDER_INTERVALS | null = null

      if (diffDays >= 6 && diffDays < 8 && !event.reminderSent7Days) {
        reminderType = '7_DAYS'
      } else if (diffDays >= 2 && diffDays < 4 && !event.reminderSent3Days) {
        reminderType = '3_DAYS'
      } else if (diffDays < 2 && diffHours >= 20 && !event.reminderSent1Day) {
        reminderType = '1_DAY'
      } else if (diffHours < 2 && diffMinutes >= 50 && !event.reminderSent1Hour) {
        reminderType = '1_HOUR'
      } else if (diffMinutes >= 10 && diffMinutes <= 20 && !event.reminderSent15Min) {
        reminderType = '15_MINUTES'
      }

      if (!reminderType) continue

      console.log(`[Event Reminders] Sending ${reminderType} reminder for event: ${event.name}`)

      // Send reminders to all registered users
      for (const userProduct of event.userProducts) {
        try {
          await sendEventReminder(userProduct.user, event, reminderType, timeDiff)
          totalSent++
        } catch (error) {
          console.error(`Failed to send reminder to ${userProduct.user.email}:`, error)
        }
      }

      // Update reminder flag
      const updateField = REMINDER_INTERVALS[reminderType].field as keyof typeof event
      await prisma.product.update({
        where: { id: event.id },
        data: { [updateField]: true }
      })

      results.push({
        eventId: event.id,
        eventName: event.name,
        reminderType,
        usersSent: event.userProducts.length
      })
    }

    console.log(`[Event Reminders] Completed. Sent ${totalSent} reminders.`)

    return NextResponse.json({
      success: true,
      totalSent,
      results
    })

  } catch (error) {
    console.error('[Event Reminders Cron] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendEventReminder(
  user: { id: string; email: string; name: string; phone: string | null },
  event: any,
  reminderType: string,
  timeDiff: number
) {
  const diffMinutes = Math.floor(timeDiff / (1000 * 60))
  const diffHours = Math.floor(timeDiff / (1000 * 60 * 60))
  const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

  let timeText = ''
  if (reminderType === '7_DAYS') {
    timeText = '7 hari lagi'
  } else if (reminderType === '3_DAYS') {
    timeText = '3 hari lagi'
  } else if (reminderType === '1_DAY') {
    timeText = 'besok'
  } else if (reminderType === '1_HOUR') {
    timeText = '1 jam lagi'
  } else if (reminderType === '15_MINUTES') {
    timeText = '15 menit lagi'
  }

  const eventDate = new Date(event.eventDate)
  const dateStr = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // 1. Send Email Notification
  try {
    await mailketing.sendEmail({
      to: user.email,
      subject: `Reminder: ${event.name} - ${timeText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">🔔 Pengingat Event</h2>
          <p>Halo ${user.name},</p>
          <p>Event <strong>${event.name}</strong> akan dimulai <strong>${timeText}</strong>!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>📅 Tanggal:</strong> ${dateStr}</p>
            ${event.eventTime ? `<p><strong>🕐 Waktu:</strong> ${event.eventTime}</p>` : ''}
            ${event.eventLocation ? `<p><strong>📍 Lokasi:</strong> ${event.eventLocation}</p>` : ''}
          </div>

          ${event.description ? `
            <div style="margin: 20px 0;">
              <h4>Deskripsi Event:</h4>
              <p>${event.description}</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-products" 
               style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Detail Event
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Jangan sampai ketinggalan! Pastikan Anda sudah siap untuk mengikuti event ini.
          </p>
        </div>
      `
    })
    console.log(`✅ Email reminder sent to ${user.email}`)
  } catch (emailError) {
    console.error(`❌ Failed to send email to ${user.email}:`, emailError)
  }

  // 2. Send WhatsApp Notification (if phone exists and Mailketing WA configured)
  if (user.phone) {
    try {
      const waMessage = `🔔 *Pengingat Event*\n\nHalo ${user.name},\n\nEvent *${event.name}* akan dimulai *${timeText}*!\n\n📅 ${dateStr}\n${event.eventTime ? `🕐 ${event.eventTime}\n` : ''}${event.eventLocation ? `📍 ${event.eventLocation}\n` : ''}\n\nJangan sampai ketinggalan!\n\nLihat detail: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-products`

      await mailketing.sendWhatsApp({
        phone: user.phone,
        message: waMessage
      })
      console.log(`✅ WhatsApp reminder sent to ${user.phone}`)
    } catch (waError) {
      console.error(`❌ Failed to send WhatsApp to ${user.phone}:`, waError)
    }
  }

  // 3. Create In-App Notification
  try {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'EVENT_REMINDER',
        title: `Event ${timeText}: ${event.name}`,
        message: `Jangan lupa! Event "${event.name}" akan dimulai ${timeText}. ${event.eventDate ? `Tanggal: ${dateStr}` : ''}`,
        link: `/dashboard/my-products`,
        isRead: false
      }
    })
    console.log(`✅ In-app notification created for user ${user.id}`)
  } catch (notifError) {
    console.error(`❌ Failed to create notification for ${user.id}:`, notifError)
  }

  // 4. Create Activity Log
  try {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'EVENT_REMINDER_SENT',
        entity: 'PRODUCT',
        entityId: event.id,
        metadata: {
          reminderType,
          eventName: event.name,
          timeDiff: diffMinutes
        }
      }
    })
  } catch (logError) {
    console.error(`❌ Failed to log activity:`, logError)
  }
}
