import { prisma } from '@/lib/prisma'
import { createBrandedEmailAsync, processShortcodes, TemplateData } from './branded-template-engine'
import { mailketing } from './integrations/mailketing'
// Import OneSignal dan Pusher services
const OneSignal = require('@onesignal/node-onesignal')
const Pusher = require('pusher')

// Initialize OneSignal (jika ada API key)
const oneSignalClient = process.env.ONESIGNAL_APP_ID ? new OneSignal.DefaultApi() : null
const oneSignalAppId = process.env.ONESIGNAL_APP_ID

// Initialize Pusher (jika ada API key)
const pusherClient = process.env.PUSHER_APP_ID ? new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'ap1',
  useTLS: true
}) : null

/**
 * Send OneSignal notification dengan branding
 */
async function sendOneSignalNotification({
  playerIds,
  title,
  message,
  url,
  bigPicture,
  data = {}
}: {
  playerIds: string[]
  title: string
  message: string
  url?: string
  bigPicture?: string
  data?: Record<string, any>
}) {
  if (!oneSignalClient || !oneSignalAppId) {
    console.warn('OneSignal not configured, skipping browser push notification')
    return
  }

  try {
    const notification = {
      app_id: oneSignalAppId,
      include_player_ids: playerIds,
      headings: {
        en: title,
        id: title
      },
      contents: {
        en: message,
        id: message
      },
      url: url || undefined,
      big_picture: bigPicture || undefined,
      web_buttons: url ? [{
        id: 'action',
        text: 'Lihat Detail',
        url: `${process.env.NEXTAUTH_URL}${url}`
      }] : undefined,
      android_accent_color: '#3B82F6', // EksporYuk blue
      data,
      priority: 9,
      ttl: 86400 // 24 hours
    }

    await oneSignalClient.createNotification(notification)
    console.log('✅ OneSignal notification sent')
  } catch (error) {
    console.error('❌ OneSignal notification failed:', error)
  }
}

/**
 * Send Pusher notification untuk real-time updates
 */
async function sendPusherNotification({
  channel,
  event,
  data
}: {
  channel: string
  event: string
  data: Record<string, any>
}) {
  if (!pusherClient) {
    console.warn('Pusher not configured, skipping real-time notification')
    return
  }

  try {
    await pusherClient.trigger(channel, event, data)
    console.log('✅ Pusher notification sent')
  } catch (error) {
    console.error('❌ Pusher notification failed:', error)
  }
}

/**
 * Get branded notification image berdasarkan category
 */
function getBrandedNotificationImage(category: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://eksporyuk.com'
  const images: Record<string, string> = {
    SYSTEM: `${baseUrl}/assets/notifications/system-update.png`,
    MEMBERSHIP: `${baseUrl}/assets/notifications/membership-success.png`,
    AFFILIATE: `${baseUrl}/assets/notifications/affiliate-achievement.png`,
    COURSE: `${baseUrl}/assets/notifications/course-success.png`,
    PAYMENT: `${baseUrl}/assets/notifications/payment-success.png`,
    MARKETING: `${baseUrl}/assets/notifications/marketing-promo.png`,
    NOTIFICATION: `${baseUrl}/assets/notifications/general-announcement.png`,
    TRANSACTION: `${baseUrl}/assets/notifications/transaction-success.png`
  }
  
  return images[category] || images.NOTIFICATION
}

/**
 * Get icon berdasarkan category
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    SYSTEM: '⚙️',
    MEMBERSHIP: '🎯',
    AFFILIATE: '💼',
    COURSE: '📚',
    PAYMENT: '💰',
    MARKETING: '📢',
    NOTIFICATION: '🔔',
    TRANSACTION: '💳'
  }
  
  return icons[category] || '📄'
}

/**
 * Fungsi helper untuk mengirim email menggunakan branded template
 * Uses Mailketing API for delivery with logo & footer from database settings
 */
export async function sendBrandedEmail({
  templateSlug,
  recipientEmail,
  recipientName,
  data = {},
  userId = null
}: {
  templateSlug: string
  recipientEmail: string
  recipientName: string
  data?: Record<string, any>
  userId?: string | null
}) {
  try {
    // Get template from database
    const template = await prisma.brandedTemplate.findFirst({
      where: {
        slug: templateSlug,
        type: 'EMAIL',
        isActive: true
      }
    })

    if (!template) {
      throw new Error(`Template not found: ${templateSlug}`)
    }

    // Prepare template data with TemplateData format
    const templateData: TemplateData = {
      name: recipientName,
      email: recipientEmail,
      ...data
    }

    // Generate branded HTML using ASYNC version (loads settings from DB)
    const emailHtml = await createBrandedEmailAsync(
      template.subject,
      template.content,
      template.ctaText || undefined,
      template.ctaLink || undefined,
      templateData
    )
    const subject = processShortcodes(template.subject, templateData)

    // Send email via Mailketing
    const emailResult = await mailketing.sendEmail({
      to: recipientEmail,
      subject,
      html: emailHtml,
      tags: ['branded', templateSlug]
    })

    if (!emailResult.success) {
      console.error(`❌ Failed to send branded email via Mailketing: ${emailResult.error}`)
    } else {
      console.log(`✅ Branded email sent via Mailketing: ${templateSlug} to ${recipientEmail}`)
    }
    
    // Track usage
    await trackTemplateUsage({
      templateId: template.id,
      userId,
      context: 'AUTOMATED',
      metadata: {
        recipient_email: recipientEmail,
        sent_at: new Date().toISOString()
      }
    })

    // Update usage count
    await prisma.brandedTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    })

    return {
      success: emailResult.success,
      templateId: template.id,
      subject,
      htmlContent: emailHtml
    }
  } catch (error) {
    console.error('Error sending branded email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Fungsi helper untuk mengirim WhatsApp message menggunakan branded template
 */
export async function sendBrandedWhatsApp({
  templateSlug,
  recipientPhone,
  recipientName,
  data = {},
  userId = null
}: {
  templateSlug: string
  recipientPhone: string
  recipientName: string
  data?: Record<string, any>
  userId?: string | null
}) {
  try {
    // Get template from database
    const template = await prisma.brandedTemplate.findFirst({
      where: {
        slug: templateSlug,
        type: 'WHATSAPP',
        isActive: true
      }
    })

    if (!template) {
      throw new Error(`Template not found: ${templateSlug}`)
    }

    // Prepare template data with TemplateData format
    const templateData: TemplateData = {
      name: recipientName,
      phone: recipientPhone,
      ...data
    }

    // Process shortcodes in content
    const message = processShortcodes(template.content, templateData)

    // Send WhatsApp (integrate dengan Starsender)
    // Contoh: await sendWhatsAppViaStarsender(recipientPhone, message)
    
    // Track usage
    await trackTemplateUsage({
      templateId: template.id,
      userId,
      context: 'AUTOMATED',
      metadata: {
        recipient_phone: recipientPhone,
        sent_at: new Date().toISOString()
      }
    })

    // Update usage count
    await prisma.brandedTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    })

    return {
      success: true,
      templateId: template.id,
      message
    }
  } catch (error) {
    console.error('Error sending branded WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Fungsi helper untuk mengirim push notification menggunakan branded template
 */
export async function sendBrandedPushNotification({
  templateSlug,
  userId,
  data = {}
}: {
  templateSlug: string
  userId: string
  data?: Record<string, any>
}) {
  try {
    // Get template from database
    const template = await prisma.brandedTemplate.findFirst({
      where: {
        slug: templateSlug,
        type: 'PUSH',
        isActive: true
      }
    })

    if (!template) {
      throw new Error(`Template not found: ${templateSlug}`)
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        oneSignalPlayerId: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Prepare template data with TemplateData format
    const templateData: TemplateData = {
      name: user.name || '',
      email: user.email || '',
      ...data
    }

    // Process shortcodes
    const title = processShortcodes(template.subject, templateData)
    const message = processShortcodes(template.content, templateData)
    const url = template.ctaLink ? processShortcodes(template.ctaLink, templateData) : undefined

    // Send via OneSignal (browser push)
    if (user.oneSignalPlayerId) {
      await sendOneSignalNotification({
        playerIds: [user.oneSignalPlayerId],
        title,
        message,
        url,
        bigPicture: getBrandedNotificationImage(template.category),
        data: {
          templateSlug,
          category: template.category,
          userId,
          timestamp: new Date().toISOString()
        }
      })
    }

    // Send via Pusher (real-time)
    await sendPusherNotification({
      channel: `user.${userId}`,
      event: 'notification',
      data: {
        title,
        message,
        url,
        category: template.category,
        icon: getCategoryIcon(template.category),
        timestamp: new Date().toISOString(),
        action: url ? 'action_required' : 'info'
      }
    })
    
    // Track usage
    await trackTemplateUsage({
      templateId: template.id,
      userId,
      context: 'AUTOMATED',
      metadata: {
        sent_at: new Date().toISOString(),
        oneSignal: !!user.oneSignalPlayerId,
        pusher: true
      }
    })

    // Update usage count
    await prisma.brandedTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    })

    return {
      success: true,
      templateId: template.id,
      title,
      message,
      url
    }
  } catch (error) {
    console.error('Error sending branded push notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Track template usage
 */
async function trackTemplateUsage({
  templateId,
  userId,
  context,
  metadata = {}
}: {
  templateId: string
  userId: string | null
  context: string
  metadata?: Record<string, any>
}) {
  try {
    await prisma.brandedTemplateUsage.create({
      data: {
        templateId,
        userId,
        context,
        metadata
      }
    })
  } catch (error) {
    console.error('Error tracking template usage:', error)
  }
}

/**
 * Get template by slug for preview or direct use
 */
export async function getBrandedTemplate(slug: string, type?: string) {
  const where: any = { slug, isActive: true }
  if (type) where.type = type

  return await prisma.brandedTemplate.findFirst({ where })
}

/**
 * Get default template for category and type
 */
export async function getDefaultTemplate(category: string, type: string) {
  return await prisma.brandedTemplate.findFirst({
    where: {
      category,
      type,
      isDefault: true,
      isActive: true
    }
  })
}

/**
 * Example usage untuk welcome email
 */
export async function sendWelcomeEmail(user: { id: string; name: string; email: string }) {
  return await sendBrandedEmail({
    templateSlug: 'welcome-email-new-member',
    recipientEmail: user.email,
    recipientName: user.name,
    data: {
      user: {
        membershipLevel: 'FREE',
        joinDate: new Date().toLocaleDateString('id-ID')
      },
      links: {
        dashboard: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()}/dashboard`
      }
    },
    userId: user.id
  })
}

/**
 * Example usage untuk affiliate commission notification
 */
export async function sendCommissionNotification(
  user: { id: string; name: string; email: string },
  transaction: { id: string; amount: string; date: string; status: string },
  totalEarnings: string,
  affiliateCode: string
) {
  return await sendBrandedEmail({
    templateSlug: 'affiliate-commission-notification',
    recipientEmail: user.email,
    recipientName: user.name,
    data: {
      user: {
        totalEarnings,
        affiliateCode
      },
      transaction,
      links: {
        affiliate: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()}/affiliate`
      }
    },
    userId: user.id
  })
}

/**
 * Example usage untuk payment confirmation
 */
export async function sendPaymentConfirmation(
  user: { id: string; name: string; email: string },
  transaction: { id: string; amount: string; type: string; date: string }
) {
  return await sendBrandedEmail({
    templateSlug: 'payment-confirmation',
    recipientEmail: user.email,
    recipientName: user.name,
    data: {
      transaction,
      links: {
        dashboard: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com').trim()}/dashboard`
      }
    },
    userId: user.id
  })
}

// ==================== AFFILIATE NOTIFICATION HELPERS ====================

/**
 * Helper untuk affiliate bio page notifications
 */
export async function sendAffiliateBioPageNotification({
  userId,
  action, // 'created' | 'updated'
  bioName,
  details = ''
}: {
  userId: string
  action: 'created' | 'updated'
  bioName: string
  details?: string
}) {
  const templateMap = {
    created: 'push-bio-page-dibuat',
    updated: 'push-bio-page-diupdate'
  }
  
  return sendBrandedPushNotification({
    templateSlug: templateMap[action],
    userId,
    data: {
      bio_name: bioName,
      details
    }
  })
}

/**
 * Helper untuk affiliate challenge notifications
 */
export async function sendAffiliateChallengeNotification({
  userId,
  action, // 'joined' | 'milestone' | 'completed'
  challengeName,
  target,
  reward,
  progress,
  challengeId
}: {
  userId: string
  action: 'joined' | 'milestone' | 'completed'
  challengeName: string
  target?: string
  reward?: string
  progress?: string
  challengeId?: string
}) {
  const templateMap = {
    joined: 'push-challenge-joined',
    milestone: 'push-challenge-milestone',
    completed: 'push-challenge-completed'
  }
  
  return sendBrandedPushNotification({
    templateSlug: templateMap[action],
    userId,
    data: {
      challenge_name: challengeName,
      target,
      reward,
      progress,
      challenge_id: challengeId,
      details: action === 'milestone' ? `Progress bagus! Terus semangat!` : undefined
    }
  })
}

/**
 * Helper untuk affiliate automation notifications
 */
export async function sendAffiliateAutomationNotification({
  userId,
  action, // 'created' | 'activated' | 'paused'
  automationName,
  trigger,
  setupGuidance,
  performanceLink,
  reason,
  automationId
}: {
  userId: string
  action: 'created' | 'activated' | 'paused'
  automationName: string
  trigger?: string
  setupGuidance?: string
  performanceLink?: string
  reason?: string
  automationId?: string
}) {
  const templateMap = {
    created: 'push-automation-created',
    activated: 'push-automation-activated',
    paused: 'push-automation-paused'
  }
  
  return sendBrandedPushNotification({
    templateSlug: templateMap[action],
    userId,
    data: {
      automation_name: automationName,
      trigger,
      setup_guidance: setupGuidance || 'Tambahkan email steps untuk aktivasi',
      performance_link: performanceLink,
      reason: reason || 'Dihentikan manual',
      automation_id: automationId
    }
  })
}

/**
 * Helper untuk affiliate commission notifications
 */
export async function sendAffiliateCommissionNotification({
  userId,
  amount,
  source,
  totalBalance,
  type = 'earned' // 'earned' | 'withdrawal_approved'
}: {
  userId: string
  amount: string
  source?: string
  totalBalance?: string
  type?: 'earned' | 'withdrawal_approved'
}) {
  const templateMap = {
    earned: 'push-komisi-masuk',
    withdrawal_approved: 'push-withdrawal-disetujui'
  }
  
  return sendBrandedPushNotification({
    templateSlug: templateMap[type],
    userId,
    data: {
      commission: amount,
      amount,
      source: source || 'Referral',
      total_balance: totalBalance
    }
  })
}

/**
 * Helper untuk affiliate lead notifications
 */
export async function sendAffiliateLeadNotification({
  userId,
  leadName,
  source
}: {
  userId: string
  leadName: string
  source: string
}) {
  return sendBrandedPushNotification({
    templateSlug: 'push-lead-captured',
    userId,
    data: {
      lead_name: leadName,
      source
    }
  })
}

/**
 * Helper untuk affiliate system notifications
 */
export async function sendAffiliateSystemNotification({
  userId,
  type, // 'training' | 'performance' | 'update' | 'feedback'
  title,
  description,
  metrics,
  actionSuggestion,
  featureName
}: {
  userId: string
  type: 'training' | 'performance' | 'update' | 'feedback'
  title?: string
  description?: string
  metrics?: string
  actionSuggestion?: string
  featureName?: string
}) {
  const templateMap = {
    training: 'push-training-update',
    performance: 'push-performance-alert',
    update: 'push-system-update',
    feedback: 'push-feedback-request'
  }
  
  return sendBrandedPushNotification({
    templateSlug: templateMap[type],
    userId,
    data: {
      training_title: title,
      feature_name: featureName || title,
      description,
      metrics,
      action_suggestion: actionSuggestion,
      feature: featureName
    }
  })
}