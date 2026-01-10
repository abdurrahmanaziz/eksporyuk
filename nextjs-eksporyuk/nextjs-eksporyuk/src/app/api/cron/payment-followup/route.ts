import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { oneSignalService } from '@/lib/onesignal'
import { pusherService } from '@/lib/pusher'
import { starsenderService } from '@/lib/services/starsenderService'
import { mailketingService } from '@/lib/services/mailketingService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// This endpoint should be called by a cron job every hour
// Configure in Vercel Cron or use external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings
    const settings = await prisma.settings.findUnique({ where: { id: 1 } })
    if (!settings || !settings.followUpEnabled) {
      return NextResponse.json({ message: 'Follow-up disabled', sent: 0 })
    }

    const now = new Date()
    const results = {
      sent: 0,
      cancelled: 0,
      errors: [] as string[]
    }

    // Get all active follow-up templates
    const templates = await prisma.followUpTemplate.findMany({
      where: { isActive: true },
      orderBy: { triggerHours: 'asc' }
    })

    // Get all pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          // Only transactions within expiry window
          gte: new Date(now.getTime() - settings.paymentExpiryHours * 60 * 60 * 1000)
        }
      },
      include: {
        user: true
      }
    })

    for (const transaction of pendingTransactions) {
      const createdAt = new Date(transaction.createdAt).getTime()
      const hoursSinceCreated = (now.getTime() - createdAt) / (1000 * 60 * 60)
      const hoursRemaining = settings.paymentExpiryHours - hoursSinceCreated

      try {
        // Get affiliate ID from metadata if exists (for logging only)
        const metadata = transaction.metadata as any

        // Find applicable templates (admin templates only)
        for (const template of templates) {
          // Only admin templates are used in auto follow-up
          if (template.ownerType !== 'admin') continue

          // Check if it's time to send this template
          const triggerWindow = 0.1 // 6 minutes window
          if (hoursSinceCreated >= template.triggerHours && 
              hoursSinceCreated < template.triggerHours + triggerWindow) {
            
            // Check if already sent
            const followUps = metadata?.followUps || []
            const alreadySent = followUps.some((f: any) => 
              f.templateId === template.id && 
              Math.abs(new Date(f.sentAt).getTime() - now.getTime()) < 60 * 60 * 1000 // within 1 hour
            )

            if (!alreadySent) {
              await sendFollowUpFromTemplate(transaction, template, hoursRemaining, settings)
              results.sent++
            }
          }
        }

        // Auto-cancel if expired
        if (hoursSinceCreated >= settings.paymentExpiryHours) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: 'FAILED',
              metadata: {
                ...(metadata || {}),
                cancelReason: 'Payment expired - no payment received',
                cancelledAt: new Date().toISOString()
              }
            }
          })
          results.cancelled++
        }
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error)
        results.errors.push(`${transaction.id}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingTransactions.length,
      results
    })

  } catch (error) {
    console.error('Payment follow-up cron error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

async function sendFollowUpFromTemplate(
  transaction: any, 
  template: any, 
  hoursRemaining: number,
  settings: any
) {
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/va/${transaction.id}`
  
  // Format time remaining
  const days = Math.floor(hoursRemaining / 24)
  const hours = Math.floor(hoursRemaining % 24)
  const timeLeft = days > 0 
    ? `${days} hari ${hours} jam` 
    : `${hours} jam`

  // Replace placeholders
  const message = template.message
    .replace('{name}', transaction.customerName)
    .replace('{amount}', transaction.amount.toLocaleString('id-ID'))
    .replace('{timeLeft}', timeLeft)
    .replace('{paymentUrl}', paymentUrl)

  // Send via different channels based on template settings
  const sendPromises = []

  // Mailkiting (Email)
  if (template.useMailkiting && settings.mailkitingEnabled && settings.mailkitingApiKey) {
    sendPromises.push(
      sendViaMailkiting(transaction.customerEmail, message, settings.mailkitingApiKey)
    )
  }

  // Starsender (WhatsApp)
  if (template.useStarsender && settings.starsenderEnabled && settings.starsenderApiKey) {
    const whatsapp = transaction.customerWhatsapp || transaction.metadata?.customerWhatsapp
    if (whatsapp) {
      sendPromises.push(
        sendViaStarsender(whatsapp, message, settings.starsenderApiKey)
      )
    }
  }

  // OneSignal (Push Notification)
  if (template.useOnesignal && settings.onesignalEnabled && settings.onesignalAppId) {
    sendPromises.push(
      sendViaOneSignal(transaction.userId, message, settings)
    )
  }

  // Pusher (Real-time)
  if (template.usePusher && settings.pusherEnabled && settings.pusherKey) {
    sendPromises.push(
      sendViaPusher(transaction.userId, message, settings)
    )
  }

  // Execute all sends
  await Promise.allSettled(sendPromises)

  // Log the follow-up
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      metadata: {
        ...(transaction.metadata as any || {}),
        followUps: [
          ...((transaction.metadata as any)?.followUps || []),
          {
            templateId: template.id,
            templateName: template.name,
            sentAt: new Date().toISOString(),
            triggerHours: template.triggerHours,
            channel: template.channel,
            message,
            integrations: {
              mailkiting: template.useMailkiting && settings.mailkitingEnabled,
              starsender: template.useStarsender && settings.starsenderEnabled,
              onesignal: template.useOnesignal && settings.onesignalEnabled,
              pusher: template.usePusher && settings.pusherEnabled
            }
          }
        ]
      }
    }
  })

  console.log(`Follow-up sent for transaction ${transaction.id} using template ${template.name}`)
}

// Integration Functions
async function sendViaMailkiting(email: string, message: string, apiKey: string) {
  try {
    if (!mailketingService.isConfigured()) {
      console.log('[Mailkiting] Not configured, skipping')
      return { success: false, channel: 'mailketing', error: 'Not configured' }
    }

    await mailketingService.sendEmail({
      to: email,
      subject: '⏰ Reminder Pembayaran - EksporYuk',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reminder Pembayaran</h2>
          <p style="white-space: pre-line; color: #555;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">Email ini dikirim otomatis oleh sistem EksporYuk</p>
        </div>
      `
    })
    
    console.log(`[Mailketing] ✅ Email sent to ${email}`)
    return { success: true, channel: 'mailketing' }
  } catch (error) {
    console.error('[Mailketing] Error:', error)
    return { success: false, channel: 'mailketing', error }
  }
}

async function sendViaStarsender(whatsapp: string, message: string, apiKey: string) {
  try {
    if (!starsenderService.isConfigured()) {
      console.log('[Starsender] Not configured, skipping')
      return { success: false, channel: 'starsender', error: 'Not configured' }
    }

    await starsenderService.sendWhatsApp({
      to: whatsapp,
      message: message
    })
    
    console.log(`[Starsender] ✅ WhatsApp sent to ${whatsapp}`)
    return { success: true, channel: 'starsender' }
  } catch (error) {
    console.error('[Starsender] Error:', error)
    return { success: false, channel: 'starsender', error }
  }
}

async function sendViaOneSignal(userId: string, message: string, settings: any) {
  try {
    if (!oneSignalService.isConfigured()) {
      console.log('[OneSignal] Not configured, skipping')
      return { success: false, channel: 'onesignal', error: 'Not configured' }
    }

    const result = await oneSignalService.sendToUser(
      userId,
      '⏰ Reminder Pembayaran',
      message,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    )
    
    if (result.success) {
      console.log(`[OneSignal] ✅ Push notification sent to user ${userId}`)
    } else {
      console.log(`[OneSignal] ⚠️ Failed to send to user ${userId}:`, result.error)
    }
    
    return { success: result.success, channel: 'onesignal', error: result.error }
  } catch (error) {
    console.error('[OneSignal] Error:', error)
    return { success: false, channel: 'onesignal', error }
  }
}

async function sendViaPusher(userId: string, message: string, settings: any) {
  try {
    if (!pusherService.isConfigured()) {
      console.log('[Pusher] Not configured, skipping')
      return { success: false, channel: 'pusher', error: 'Not configured' }
    }

    const result = await pusherService.notifyUser(userId, 'payment-reminder', {
      id: `reminder-${Date.now()}`,
      title: '⏰ Reminder Pembayaran',
      message: message,
      type: 'payment_reminder',
      timestamp: new Date().toISOString()
    })
    
    if (result.success) {
      console.log(`[Pusher] ✅ Real-time notification sent to user ${userId}`)
    } else {
      console.log(`[Pusher] ⚠️ Failed to send to user ${userId}:`, result.error)
    }
    
    return { success: result.success, channel: 'pusher', error: result.error }
  } catch (error) {
    console.error('[Pusher] Error:', error)
    return { success: false, channel: 'pusher', error }
  }
}

// Legacy function for backward compatibility
async function sendFollowUp(transaction: any, messageTemplate: string | null, hoursRemaining: number) {
  if (!messageTemplate) return

  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/va/${transaction.id}`
  
  // Format time remaining
  const days = Math.floor(hoursRemaining / 24)
  const hours = Math.floor(hoursRemaining % 24)
  const timeLeft = days > 0 
    ? `${days} hari ${hours} jam` 
    : `${hours} jam`

  // Replace placeholders
  const message = messageTemplate
    .replace('{name}', transaction.customerName)
    .replace('{amount}', transaction.amount.toLocaleString('id-ID'))
    .replace('{timeLeft}', timeLeft)
    .replace('{paymentUrl}', paymentUrl)

  // Send via WhatsApp (StarSender) or Email
  // TODO: Integrate with actual messaging service
  console.log(`Follow-up for ${transaction.customerEmail}:`, message)

  // Log the follow-up
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      metadata: {
        ...(transaction.metadata as any || {}),
        followUps: [
          ...((transaction.metadata as any)?.followUps || []),
          {
            sentAt: new Date().toISOString(),
            type: hoursRemaining > 48 ? '1hour' : hoursRemaining > 24 ? '24hour' : '48hour',
            message
          }
        ]
      }
    }
  })

  // TODO: Integrate with WhatsApp API (StarSender) or Email service
  // Example:
  // await sendWhatsAppMessage(transaction.customerWhatsapp, message)
  // await sendEmail(transaction.customerEmail, 'Payment Reminder', message)
}