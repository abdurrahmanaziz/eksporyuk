import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'

/**
 * Product Reminder Cron Job
 * Triggers automated reminders based on product purchase and configured sequences
 * 
 * Triggers:
 * - AFTER_PURCHASE: X days/hours after product purchase
 * - BEFORE_EXPIRY: X days/hours before product access expires (if applicable)
 * - ON_SPECIFIC_DATE: On a specific calendar date
 * - PENDING_PAYMENT: X hours after pending payment (payment reminder)
 * - DOWNLOAD_REMINDER: Remind to download if not downloaded yet
 * 
 * Called via: Vercel Cron, external scheduler, or manual endpoint
 * Authorization: Uses CRON_SECRET env variable
 * 
 * @route GET /api/cron/product-reminders
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

    console.log('[Product Reminders] Starting cron job')

    let processedReminders = 0
    let sentNotifications = 0
    let failedNotifications = 0

    const now = new Date()

    // 1. Process ProductReminder (purchased products)
    const productReminders = await prisma.productReminder.findMany({
      where: { isActive: true },
      include: {
        product: true,
      },
    })

    console.log(`[Product Reminders] Found ${productReminders.length} active product reminders`)

    // Process each reminder
    for (const reminder of productReminders) {
      try {
        // Get all users who purchased this product
        const userProducts = await prisma.userProduct.findMany({
          where: {
            productId: reminder.productId,
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
          `[Product Reminders] Processing reminder "${reminder.title}" for ${userProducts.length} users`
        )

        // Check each user product against this reminder
        for (const userProduct of userProducts) {
          try {
            // Calculate when this reminder should be sent
            const sendTime = calculateSendTime(reminder, userProduct)

            if (!sendTime) {
              continue // Skip if conditions not met
            }

            // Check if we're within sending window (allow ±15 min buffer)
            const timeDiff = Math.abs(now.getTime() - sendTime.getTime())
            const bufferMs = 15 * 60 * 1000 // 15 minutes

            if (timeDiff > bufferMs) {
              continue // Not time yet or already past
            }

            // Check if already sent (via ReminderLog)
            const existingLog = await prisma.reminderLog.findFirst({
              where: {
                reminderId: reminder.id,
                userId: userProduct.userId,
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
                userId: userProduct.userId,
                channel: 'MULTI',
                status: 'PENDING',
                scheduledAt: now,
              },
            })

            // Prepare notification content
            const notificationContent = prepareNotificationContent(
              reminder,
              userProduct,
              userProduct.user
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
                userId: userProduct.userId,
                type: 'REMINDER',
                title: notificationContent.pushTitle || reminder.title,
                message: notificationContent.pushBody || notificationContent.emailBody || reminder.description || '',
                sourceType: 'PRODUCT_REMINDER',
                sourceId: reminder.id,
                link: notificationContent.pushClickAction || notificationContent.emailCTALink,
                image: notificationContent.pushIcon,
                channels,
                metadata: {
                  reminderId: reminder.id,
                  productId: reminder.productId,
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
                await prisma.productReminder.update({
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

                await prisma.productReminder.update({
                  where: { id: reminder.id },
                  data: { failedCount: { increment: 1 } },
                })

                failedNotifications++
              }
            } catch (error) {
              console.error(
                `[Product Reminders] Notification send failed for user ${userProduct.userId}:`,
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
              `[Product Reminders] Error processing reminder for user ${userProduct.userId}:`,
              error
            )
            failedNotifications++
          }
        }

        processedReminders++
      } catch (error) {
        console.error(`[Product Reminders] Error processing reminder ${reminder.id}:`, error)
      }
    }

    // 2. Process Pending Payment Reminders (transactions with PENDING status)
    const pendingResult = await processPendingPaymentReminders(now)
    sentNotifications += pendingResult.sent
    failedNotifications += pendingResult.failed

    console.log('[Product Reminders] Cron job completed', {
      processedReminders,
      sentNotifications,
      failedNotifications,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Product reminders cron job completed',
        stats: {
          processedReminders,
          sentNotifications,
          failedNotifications,
          pendingPaymentReminders: pendingResult,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Product Reminders] Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Process pending payment reminders
 * Send reminders to users with pending payments after 1hr, 3hr, 6hr, 24hr
 */
async function processPendingPaymentReminders(now: Date) {
  let sent = 0
  let failed = 0

  try {
    // Get pending transactions for products
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        type: 'PRODUCT',
        createdAt: {
          // Only get transactions from last 48 hours
          gte: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        },
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
        product: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
          },
        },
      },
    })

    console.log(`[Product Reminders] Found ${pendingTransactions.length} pending product transactions`)

    // Reminder intervals in hours
    const reminderIntervals = [1, 3, 6, 24]

    for (const transaction of pendingTransactions) {
      if (!transaction.user || !transaction.product) continue

      const hoursSinceCreated = (now.getTime() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60)

      // Find which reminder should be sent
      for (const interval of reminderIntervals) {
        // Check if within 30 min window of interval
        if (Math.abs(hoursSinceCreated - interval) <= 0.5) {
          // Check if this reminder was already sent
          const reminderKey = `pending_payment_${interval}h_${transaction.id}`
          
          const existingLog = await prisma.reminderLog.findFirst({
            where: {
              userId: transaction.userId,
              metadata: {
                path: ['reminderKey'],
                equals: reminderKey,
              },
            },
          })

          if (existingLog) continue // Already sent

          try {
            // Send payment reminder notification
            const result = await notificationService.send({
              userId: transaction.userId,
              type: 'PAYMENT_REMINDER',
              title: '⏰ Segera Selesaikan Pembayaran',
              message: `Pesanan ${transaction.product.name} menunggu pembayaran Anda. Selesaikan sebelum link pembayaran expired!`,
              sourceType: 'TRANSACTION',
              sourceId: transaction.id,
              link: transaction.paymentUrl || `/payment/pending/${transaction.id}`,
              image: transaction.product.thumbnail || undefined,
              channels: ['email', 'pusher'],
              metadata: {
                reminderKey,
                transactionId: transaction.id,
                productName: transaction.product.name,
                amount: transaction.amount,
                hoursWaiting: interval,
              },
            })

            if (result.success && result.notificationId !== 'skipped') {
              // Log this reminder
              await prisma.reminderLog.create({
                data: {
                  reminderId: `pending_payment_${interval}h`,
                  userId: transaction.userId,
                  channel: 'MULTI',
                  status: 'SENT',
                  sentAt: now,
                  metadata: { reminderKey },
                },
              })
              sent++
              console.log(`[Product Reminders] Sent ${interval}h payment reminder for transaction ${transaction.id}`)
            }
          } catch (error) {
            console.error(`[Product Reminders] Failed to send payment reminder:`, error)
            failed++
          }
          
          break // Only send one reminder per transaction
        }
      }
    }
  } catch (error) {
    console.error('[Product Reminders] Error processing pending payments:', error)
  }

  return { sent, failed }
}

/**
 * Calculate when a reminder should be sent for a specific user product
 */
function calculateSendTime(reminder: any, userProduct: any): Date | null {
  let baseDate: Date
  let sendTime: Date

  switch (reminder.triggerType) {
    case 'AFTER_PURCHASE':
      // Trigger X days/hours after product purchased
      baseDate = new Date(userProduct.purchaseDate)
      sendTime = addTime(baseDate, reminder.delayAmount, reminder.delayUnit)
      break

    case 'BEFORE_EXPIRY':
      // Trigger X days/hours before product access expires
      if (!userProduct.expiresAt) return null
      baseDate = new Date(userProduct.expiresAt)
      sendTime = subtractTime(baseDate, reminder.delayAmount, reminder.delayUnit)
      break

    case 'ON_SPECIFIC_DATE':
      // Trigger on specific calendar date
      if (!reminder.specificDate) return null
      baseDate = new Date(reminder.specificDate)
      sendTime = baseDate
      break

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
    const offset = getTimezoneOffset(reminder.timezone)
    sendTime = new Date(sendTime.getTime() + offset * 60 * 1000)
  }

  // Check day of week restrictions
  if (reminder.daysOfWeek && Array.isArray(reminder.daysOfWeek) && reminder.daysOfWeek.length > 0) {
    const dayOfWeek = sendTime.getDay()
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek

    if (!reminder.daysOfWeek.includes(isoDay)) {
      return null
    }
  }

  // Check weekend avoidance
  if (reminder.avoidWeekends) {
    const dayOfWeek = sendTime.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return null
    }
  }

  return sendTime
}

/**
 * Prepare notification content with variable substitution
 */
function prepareNotificationContent(reminder: any, userProduct: any, user: any) {
  const product = reminder.product

  const variables: Record<string, any> = {
    customer_name: user.name || 'Customer',
    name: user.name || 'Customer',
    email: user.email,
    phone: user.phone,
    product_name: product?.name || 'Produk',
    order_number: userProduct.transactionId || userProduct.id,
    purchase_date: new Date(userProduct.purchaseDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    price: Number(userProduct.price).toLocaleString('id-ID'),
    download_link: `${process.env.NEXT_PUBLIC_APP_URL}/my-products`,
    dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL}/my-dashboard`,
    product_link: product?.slug ? `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}` : '',
    expiry_date: userProduct.expiresAt 
      ? new Date(userProduct.expiresAt).toLocaleDateString('id-ID')
      : 'Selamanya',
    days_until_expiry: userProduct.expiresAt
      ? Math.ceil((new Date(userProduct.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 'Unlimited',
  }

  const substituteVars = (text: string | null) => {
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
    'Asia/Jakarta': -420,
    'Asia/Makassar': -480,
    'Asia/Jayapura': -540,
    'UTC': 0,
  }

  return timezoneOffsets[timezone] || 0
}
