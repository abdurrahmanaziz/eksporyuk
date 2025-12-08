import { prisma } from '@/lib/prisma'
import { createBrandedEmail, processShortcodes, TemplateData } from './branded-template-engine'
import { mailketing } from './integrations/mailketing'

/**
 * Fungsi helper untuk mengirim email menggunakan branded template
 * Uses Mailketing API for delivery
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

    // Generate branded HTML using the correct function signature
    const emailHtml = createBrandedEmail(
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

    // Send push notification (integrate dengan OneSignal)
    // Contoh: await sendPushViaOneSignal(user.oneSignalPlayerId, title, message, url)
    
    // Track usage
    await trackTemplateUsage({
      templateId: template.id,
      userId,
      context: 'AUTOMATED',
      metadata: {
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
        dashboard: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
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
        affiliate: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate`
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
        dashboard: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }
    },
    userId: user.id
  })
}