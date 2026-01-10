import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cron/event-quota-audit
 * Daily cron job to check all full/critical events and notify admins
 * Call this via external cron service (e.g., EasyCron)
 * 
 * Security: Add CRON_SECRET validation
 */
export async function GET(request: NextRequest) {
  try {
    // Validate cron secret
    const cronSecret = request.nextUrl.searchParams.get('secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      console.warn('[Event Quota Audit Cron] ❌ Invalid cron secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Event Quota Audit Cron] === START ===')

    // Get all active events
    const events = await prisma.product.findMany({
      where: {
        productType: 'EVENT',
        isActive: true,
        eventDate: {
          gte: new Date() // Only upcoming events
        }
      },
      select: {
        id: true,
        name: true,
        maxParticipants: true,
        eventDate: true,
        creatorId: true
      }
    })

    console.log('[Event Quota Audit Cron] Found events:', events.length)

    // Check quota for each event
    const alertsToSend = []

    for (const event of events) {
      if (!event.maxParticipants) continue

      const registrationCount = await prisma.userProduct.count({
        where: { productId: event.id }
      })

      const percentFull = (registrationCount / event.maxParticipants) * 100
      const remaining = event.maxParticipants - registrationCount

      // Alert only if FULL or CRITICAL
      if (percentFull >= 80) {
        const creator = await prisma.user.findUnique({
          where: { id: event.creatorId },
          select: { id: true, email: true, whatsapp: true, name: true, role: true }
        })

        if (creator) {
          let alertType = 'AVAILABLE'
          if (percentFull >= 100) {
            alertType = 'FULL'
          } else if (percentFull >= 95) {
            alertType = 'CRITICAL'
          } else if (percentFull >= 80) {
            alertType = 'WARNING'
          }

          const alert = {
            eventId: event.id,
            eventName: event.name,
            eventDate: event.eventDate,
            creatorEmail: creator.email,
            creatorName: creator.name,
            registrations: registrationCount,
            maxParticipants: event.maxParticipants,
            percentFull: Math.round(percentFull * 10) / 10,
            remaining: remaining,
            alertType: alertType,
            message: `Event "${event.name}" quota ${alertType.toLowerCase()}: ${registrationCount}/${event.maxParticipants} (${percentFull.toFixed(1)}% penuh). Sisa ${remaining} tempat.`
          }

          alertsToSend.push(alert)

          console.log('[Event Quota Audit Cron] 🔔 Alert:', alert.message)

          // TODO: Integrate with notificationService to send email/WhatsApp
          // Example integration:
          // if (creator.email && alertType === 'FULL') {
          //   await notificationService.sendEmail({
          //     to: creator.email,
          //     subject: `⚠️ EVENT QUOTA PENUH: ${event.name}`,
          //     template: 'event-quota-alert',
          //     data: alert
          //   })
          // }
          //
          // if (creator.whatsapp && alertType === 'CRITICAL') {
          //   await starsenderService.sendMessage({
          //     phone: creator.whatsapp,
          //     message: `Halo ${creator.name}! Event "${event.name}" quota 95% penuh. Cek: https://eksporyuk.com/admin/events`
          //   })
          // }
        }
      }
    }

    console.log('[Event Quota Audit Cron] === END ===')
    console.log('[Event Quota Audit Cron] Total alerts:', alertsToSend.length)

    return NextResponse.json({
      success: true,
      message: `Audit completed. ${alertsToSend.length} alerts generated.`,
      alerts: alertsToSend,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Event Quota Audit Cron] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Audit failed', details: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
