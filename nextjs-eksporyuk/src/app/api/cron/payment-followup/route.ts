import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    // TODO: Implement actual Mailkiting API call
    console.log(`[Mailkiting] Sending to ${email}:`, message)
    
    // Example API call:
    // const response = await fetch('https://api.mailkiting.com/v1/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     to: email,
    //     subject: 'Reminder Pembayaran',
    //     message: message
    //   })
    // })
    
    return { success: true, channel: 'mailkiting' }
  } catch (error) {
    console.error('Mailkiting error:', error)
    return { success: false, channel: 'mailkiting', error }
  }
}

async function sendViaStarsender(whatsapp: string, message: string, apiKey: string) {
  try {
    // TODO: Implement actual Starsender API call
    console.log(`[Starsender] Sending to ${whatsapp}:`, message)
    
    // Example API call:
    // const response = await fetch('https://api.starsender.online/api/sendText', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': apiKey,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     phone: whatsapp,
    //     message: message
    //   })
    // })
    
    return { success: true, channel: 'starsender' }
  } catch (error) {
    console.error('Starsender error:', error)
    return { success: false, channel: 'starsender', error }
  }
}

async function sendViaOneSignal(userId: string, message: string, settings: any) {
  try {
    // TODO: Implement actual OneSignal API call
    console.log(`[OneSignal] Sending to user ${userId}:`, message)
    
    // Example API call:
    // const response = await fetch('https://onesignal.com/api/v1/notifications', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${settings.onesignalApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     app_id: settings.onesignalAppId,
    //     filters: [{ field: 'tag', key: 'userId', value: userId }],
    //     contents: { en: message }
    //   })
    // })
    
    return { success: true, channel: 'onesignal' }
  } catch (error) {
    console.error('OneSignal error:', error)
    return { success: false, channel: 'onesignal', error }
  }
}

async function sendViaPusher(userId: string, message: string, settings: any) {
  try {
    // TODO: Implement actual Pusher call
    console.log(`[Pusher] Sending to user ${userId}:`, message)
    
    // Example:
    // const Pusher = require('pusher')
    // const pusher = new Pusher({
    //   appId: settings.pusherAppId,
    //   key: settings.pusherKey,
    //   secret: settings.pusherSecret,
    //   cluster: settings.pusherCluster
    // })
    // await pusher.trigger(`user-${userId}`, 'payment-reminder', { message })
    
    return { success: true, channel: 'pusher' }
  } catch (error) {
    console.error('Pusher error:', error)
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