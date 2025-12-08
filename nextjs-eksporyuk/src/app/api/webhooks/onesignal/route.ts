import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * OneSignal Webhook Handler
 * POST /api/webhooks/onesignal
 * 
 * Menerima dan memproses webhook events dari OneSignal:
 * - notification.delivered
 * - notification.opened
 * - notification.clicked
 * - notification.bounced
 * 
 * Konfigurasi OneSignal:
 * 1. Go to OneSignal Settings → Webhooks
 * 2. Add Webhook: https://eksporyuk.com/api/webhooks/onesignal
 * 3. Set Authentication Header: Authorization: Bearer {ONESIGNAL_WEBHOOK_TOKEN}
 * 4. Select events to receive
 */

const WEBHOOK_SECRET = process.env.ONESIGNAL_WEBHOOK_SECRET || ''

/**
 * Verify OneSignal webhook signature
 * OneSignal mengirim signature dalam header X-OneSignal-Signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !WEBHOOK_SECRET) {
    console.warn('[OneSignal Webhook] No signature or secret found')
    // Dalam production, harus reject unsigned webhooks
    return process.env.NODE_ENV === 'development'
  }

  try {
    const hash = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('base64')

    return hash === signature
  } catch (error) {
    console.error('[OneSignal Webhook] Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  let body: string = ''

  try {
    // Read raw body untuk signature verification
    body = await request.text()

    // Verify signature
    const signature = request.headers.get('X-OneSignal-Signature')
    if (!verifyWebhookSignature(body, signature)) {
      console.warn('[OneSignal Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse JSON
    const event = JSON.parse(body)

    // Log webhook untuk debugging
    await logWebhook(event)

    // Handle berdasarkan event type
    switch (event.type) {
      case 'notification.delivered':
        await handleNotificationDelivered(event)
        break

      case 'notification.opened':
        await handleNotificationOpened(event)
        break

      case 'notification.clicked':
        await handleNotificationClicked(event)
        break

      case 'notification.bounced':
        await handleNotificationBounced(event)
        break

      default:
        console.log(`[OneSignal Webhook] Unknown event type: ${event.type}`)
    }

    return NextResponse.json({ success: true, processed: true })
  } catch (error) {
    console.error('[OneSignal Webhook] Error:', error)

    // Log error untuk debugging
    if (body) {
      try {
        await logWebhook(JSON.parse(body), 'failed', String(error))
      } catch (logError) {
        console.error('[OneSignal Webhook] Failed to log error:', logError)
      }
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle: Notification berhasil dikirim ke device
 */
async function handleNotificationDelivered(event: any) {
  try {
    const { notification_id, player_ids } = event

    if (!notification_id || !player_ids || !Array.isArray(player_ids)) {
      console.warn('[OneSignal] Invalid delivered event payload')
      return
    }

    // Insert delivery log untuk setiap player
    const logs = player_ids.map((playerId: string) => ({
      notificationId: notification_id,
      playerId,
      status: 'delivered' as const,
      timestamp: new Date(event.timestamp * 1000) || new Date()
    }))

    // Bulk insert untuk performa
    for (const log of logs) {
      await prisma.notificationDeliveryLog.create({
        data: log
      }).catch(err => {
        console.warn('[OneSignal] Failed to log delivery:', err.message)
      })
    }

    console.log(`[OneSignal] Logged ${logs.length} deliveries`)
  } catch (error) {
    console.error('[OneSignal] Error in handleNotificationDelivered:', error)
  }
}

/**
 * Handle: Notification dibuka user
 */
async function handleNotificationOpened(event: any) {
  try {
    const { notification_id, player_id } = event

    if (!notification_id || !player_id) {
      console.warn('[OneSignal] Invalid opened event payload')
      return
    }

    // Update existing log atau create baru
    await prisma.notificationDeliveryLog.upsert({
      where: {
        id: `${notification_id}_${player_id}_opened`
      },
      create: {
        notificationId: notification_id,
        playerId: player_id,
        status: 'opened',
        openedAt: new Date(event.timestamp * 1000) || new Date(),
        timestamp: new Date()
      },
      update: {
        status: 'opened',
        openedAt: new Date(event.timestamp * 1000) || new Date()
      }
    }).catch(() => {
      // Fallback: direct update
      prisma.notificationDeliveryLog.updateMany({
        where: {
          notificationId: notification_id,
          playerId: player_id
        },
        data: {
          status: 'opened',
          openedAt: new Date(event.timestamp * 1000) || new Date()
        }
      })
    })

    console.log(`[OneSignal] Logged notification open: ${notification_id}`)
  } catch (error) {
    console.error('[OneSignal] Error in handleNotificationOpened:', error)
  }
}

/**
 * Handle: Notification diklik user (link dibuka)
 */
async function handleNotificationClicked(event: any) {
  try {
    const { notification_id, player_id, click_url } = event

    if (!notification_id || !player_id) {
      console.warn('[OneSignal] Invalid clicked event payload')
      return
    }

    // Update dengan click info
    await prisma.notificationDeliveryLog.updateMany({
      where: {
        notificationId: notification_id,
        playerId: player_id
      },
      data: {
        status: 'clicked',
        clickedAt: new Date(event.timestamp * 1000) || new Date(),
        clickUrl: click_url || undefined
      }
    })

    // Cari user berdasarkan player ID untuk conversion tracking
    const user = await prisma.user.findFirst({
      where: { oneSignalPlayerId: player_id },
      select: { id: true }
    })

    if (user) {
      // Log conversion event
      await prisma.conversionEvent.create({
        data: {
          userId: user.id,
          notificationId: notification_id,
          conversionType: 'notification_click',
          conversionUrl: click_url,
          metadata: {
            playerId: player_id,
            eventTime: new Date(event.timestamp * 1000).toISOString()
          }
        }
      }).catch(err => {
        console.warn('[OneSignal] Failed to log conversion:', err.message)
      })
    }

    console.log(`[OneSignal] Logged notification click: ${notification_id}`)
  } catch (error) {
    console.error('[OneSignal] Error in handleNotificationClicked:', error)
  }
}

/**
 * Handle: Notification delivery gagal (bounce)
 */
async function handleNotificationBounced(event: any) {
  try {
    const { notification_id, player_id, bounce_reason } = event

    if (!notification_id || !player_id) {
      console.warn('[OneSignal] Invalid bounced event payload')
      return
    }

    // Log bounce
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: notification_id,
        playerId: player_id,
        status: 'bounced',
        bounceReason: bounce_reason,
        timestamp: new Date(event.timestamp * 1000) || new Date()
      }
    }).catch(err => {
      console.warn('[OneSignal] Failed to log bounce:', err.message)
    })

    // Jika bounce terus-menerus, unsubscribe player dari system
    if (bounce_reason === 'InvalidDeviceToken' || bounce_reason === 'InvalidCredentials') {
      const user = await prisma.user.findFirst({
        where: { oneSignalPlayerId: player_id },
        select: { id: true }
      })

      if (user) {
        // Unlink player ID dari user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            oneSignalPlayerId: null,
            oneSignalSubscribedAt: null
          }
        }).catch(err => {
          console.warn('[OneSignal] Failed to unsubscribe user:', err.message)
        })

        console.log(`[OneSignal] Unsubscribed user ${user.id} due to ${bounce_reason}`)
      }
    }

    console.log(`[OneSignal] Logged notification bounce: ${notification_id}`)
  } catch (error) {
    console.error('[OneSignal] Error in handleNotificationBounced:', error)
  }
}

/**
 * Log webhook event untuk debugging dan audit trail
 */
async function logWebhook(event: any, status: string = 'success', errorMessage?: string) {
  try {
    await prisma.oneSignalWebhookLog.create({
      data: {
        eventType: event.type || 'unknown',
        payload: event,
        processingStatus: status as 'success' | 'pending' | 'failed',
        errorMessage: errorMessage || null
      }
    }).catch(err => {
      console.warn('[OneSignal] Failed to log webhook:', err.message)
    })
  } catch (error) {
    console.error('[OneSignal] Failed to create webhook log:', error)
  }
}
