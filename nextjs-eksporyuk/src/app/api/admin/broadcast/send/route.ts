import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { getMailketingConfig, getStarSenderConfig } from '@/lib/integration-config'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/broadcast/send
 * Send broadcast campaign
 * ADMIN ONLY
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Get campaign
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if campaign is already sending or completed
    if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Campaign is already sending or completed' },
        { status: 400 }
      )
    }

    // Update campaign status to SENDING
    await prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: { 
        status: 'SENDING',
        startedAt: new Date()
      }
    })

    // Get target users
    const targetUsers = await getTargetUsers(campaign)

    if (targetUsers.length === 0) {
      await prisma.broadcastCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'FAILED',
          completedAt: new Date()
        }
      })

      return NextResponse.json(
        { success: false, error: 'No target users found' },
        { status: 400 }
      )
    }

    // Update total recipients
    await prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: { totalRecipients: targetUsers.length }
    })

    // Process sending in background (don't wait for completion)
    processBroadcast(campaign, targetUsers).catch(error => {
      console.error('[BROADCAST_SEND] Processing error:', error)
    })

    return NextResponse.json({
      success: true,
      message: `Broadcast started for ${targetUsers.length} recipients`,
      totalRecipients: targetUsers.length
    })
  } catch (error: any) {
    console.error('[BROADCAST_SEND] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}

/**
 * Get target users based on campaign targeting
 */
async function getTargetUsers(campaign: any): Promise<any[]> {
  let where: any = {
    isActive: true
  }

  switch (campaign.targetType) {
    case 'ALL':
      break

    case 'BY_ROLE':
      if (campaign.targetRoles && Array.isArray(campaign.targetRoles)) {
        where.role = { in: campaign.targetRoles }
      }
      break

    case 'BY_MEMBERSHIP':
      if (campaign.targetMembershipIds && Array.isArray(campaign.targetMembershipIds)) {
        where.userMemberships = {
          some: {
            membershipId: { in: campaign.targetMembershipIds },
            isActive: true,
            endDate: { gt: new Date() }
          }
        }
      }
      break

    case 'BY_GROUP':
      if (campaign.targetGroupIds && Array.isArray(campaign.targetGroupIds)) {
        where.groupMemberships = {
          some: {
            groupId: { in: campaign.targetGroupIds },
            status: 'ACTIVE'
          }
        }
      }
      break

    case 'BY_COURSE':
      if (campaign.targetCourseIds && Array.isArray(campaign.targetCourseIds)) {
        where.courseEnrollments = {
          some: {
            courseId: { in: campaign.targetCourseIds },
            status: 'ACTIVE'
          }
        }
      }
      break

    case 'BY_TRANSACTION':
      let transactionWhere: any = {}
      
      if (campaign.targetTransactionStatus && Array.isArray(campaign.targetTransactionStatus) && campaign.targetTransactionStatus.length > 0) {
        transactionWhere.status = { in: campaign.targetTransactionStatus }
      }
      
      if (campaign.targetTransactionType && Array.isArray(campaign.targetTransactionType) && campaign.targetTransactionType.length > 0) {
        transactionWhere.type = { in: campaign.targetTransactionType }
      }
      
      if (Object.keys(transactionWhere).length > 0) {
        where.transactions = {
          some: transactionWhere
        }
      }
      break

    case 'BY_EVENT':
      if (campaign.targetEventIds && Array.isArray(campaign.targetEventIds) && campaign.targetEventIds.length > 0) {
        where.eventRegistrations = {
          some: {
            eventId: { in: campaign.targetEventIds }
          }
        }
      }
      break

    case 'CUSTOM':
      if (campaign.customUserIds && Array.isArray(campaign.customUserIds)) {
        where.id = { in: campaign.customUserIds }
      }
      break
  }

  // Filter by notification preferences
  if (campaign.type === 'EMAIL') {
    where.emailNotifications = true
    where.email = { not: null }
  } else if (campaign.type === 'WHATSAPP') {
    where.whatsappNotifications = true
    where.whatsapp = { not: null }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      role: true,
      emailNotifications: true,
      whatsappNotifications: true,
      userMemberships: {
        where: {
          isActive: true,
          endDate: { gt: new Date() }
        },
        select: {
          status: true,
          membership: {
            select: {
              name: true
            }
          }
        }
      },
      transactions: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          paidAt: true,
          expiredAt: true,
          product: {
            select: {
              name: true
            }
          },
          course: {
            select: {
              title: true
            }
          },
          membership: {
            select: {
              membership: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  })

  return users
}

/**
 * Process broadcast sending in background
 */
async function processBroadcast(campaign: any, users: any[]) {
  let sentCount = 0
  let failedCount = 0

  // Get integration configs
  const mailketingConfig = campaign.type === 'EMAIL' || campaign.type === 'BOTH' 
    ? await getMailketingConfig() 
    : null
    
  const starsenderConfig = campaign.type === 'WHATSAPP' || campaign.type === 'BOTH'
    ? await getStarSenderConfig()
    : null

  for (const user of users) {
    try {
      // Send Email
      if ((campaign.type === 'EMAIL' || campaign.type === 'BOTH') && user.emailNotifications && user.email && mailketingConfig) {
        // Create log first to get logId for tracking
        const log = await prisma.broadcastLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            channel: 'EMAIL',
            status: 'PENDING'
          }
        })

        const emailResult = await sendEmail(campaign, user, mailketingConfig, log.id)
        
        // Update log with result
        await prisma.broadcastLog.update({
          where: { id: log.id },
          data: {
            status: emailResult.success ? 'SENT' : 'FAILED',
            sentAt: emailResult.success ? new Date() : null,
            failedAt: emailResult.success ? null : new Date(),
            errorMessage: emailResult.error || null
          }
        })

        if (emailResult.success) {
          sentCount++
        } else {
          failedCount++
        }
      }

      // Send WhatsApp
      if ((campaign.type === 'WHATSAPP' || campaign.type === 'BOTH') && user.whatsappNotifications && user.whatsapp && starsenderConfig) {
        const whatsappResult = await sendWhatsApp(campaign, user, starsenderConfig)
        
        await prisma.broadcastLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            channel: 'WHATSAPP',
            status: whatsappResult.success ? 'SENT' : 'FAILED',
            sentAt: whatsappResult.success ? new Date() : null,
            failedAt: whatsappResult.success ? null : new Date(),
            errorMessage: whatsappResult.error || null
          }
        })

        if (whatsappResult.success) {
          sentCount++
        } else {
          failedCount++
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error: any) {
      console.error(`[BROADCAST] Error sending to user ${user.id}:`, error)
      failedCount++
    }
  }

  // Update campaign completion
  await prisma.broadcastCampaign.update({
    where: { id: campaign.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      sentCount,
      failedCount
    }
  })
}

/**
 * Send email via Mailketing
 */
async function sendEmail(campaign: any, user: any, config: any, logId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get email footer settings
    const settings = await prisma.settings.findFirst()
    
    // Replace shortcodes in content
    const subject = replaceShortcodes(campaign.emailSubject || '', user)
    let body = replaceShortcodes(campaign.emailBody || '', user)

    // Add email footer from settings
    const footer = generateEmailFooter(settings, user)
    body = body + footer

    // Inject tracking pixel at end of email
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/pixel/${logId}" width="1" height="1" style="display:none" />`
    body = body + trackingPixel

    // Wrap links with click tracking
    body = wrapLinksWithTracking(body, logId)

    // Build email payload
    const emailPayload: Record<string, any> = {
      to: user.email,
      subject,
      html: body,
      from: config.MAILKETING_SENDER_EMAIL || 'noreply@eksporyuk.com',
      from_name: config.MAILKETING_SENDER_NAME || 'EksporYuk'
    }

    // Add Reply-To if configured
    if (config.MAILKETING_REPLY_TO_EMAIL) {
      emailPayload.reply_to = config.MAILKETING_REPLY_TO_EMAIL
    }

    // Add Forward/CC email if configured (copy to admin)
    if (config.MAILKETING_FORWARD_EMAIL) {
      emailPayload.cc = config.MAILKETING_FORWARD_EMAIL
    }

    const response = await fetch(`https://api.mailketing.co.id/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.MAILKETING_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Send WhatsApp via StarSender
 */
async function sendWhatsApp(campaign: any, user: any, config: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Replace shortcodes in content
    const message = replaceShortcodes(campaign.whatsappMessage || '', user)

    const response = await fetch(`${config.STARSENDER_API_URL}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.STARSENDER_API_KEY}`
      },
      body: JSON.stringify({
        phone: user.whatsapp,
        message,
        device: config.STARSENDER_DEVICE_ID
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Wrap all links in email with click tracking
 */
function wrapLinksWithTracking(html: string, logId: string): string {
  // Match all <a> tags and wrap href with tracking URL
  return html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (match, before, url, after) => {
    // Don't track if already a tracking URL or unsubscribe link
    if (url.includes('/api/tracking/') || url.includes('/unsubscribe')) {
      return match
    }
    
    // Create tracking URL
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/click/${logId}?url=${encodeURIComponent(url)}`
    return `<a ${before}href="${trackingUrl}"${after}>`
  })
}

/**
 * Generate email footer from settings
 */
function generateEmailFooter(settings: any, user: any): string {
  const companyName = settings?.emailFooterCompanyName || 'EksporYuk'
  const description = settings?.emailFooterDescription || 'Platform Edukasi & Mentoring Ekspor Terpercaya'
  const address = settings?.emailFooterAddress || 'Jakarta, Indonesia'
  const supportEmail = settings?.emailFooterSupportEmail || 'support@eksporyuk.com'
  const websiteUrl = settings?.emailFooterWebsiteUrl || 'https://eksporyuk.com'
  const instagramUrl = settings?.emailFooterInstagramUrl || ''
  const facebookUrl = settings?.emailFooterFacebookUrl || ''
  const linkedinUrl = settings?.emailFooterLinkedinUrl || ''
  const copyrightText = settings?.emailFooterCopyrightText || 'EksporYuk. All rights reserved.'
  const currentYear = new Date().getFullYear()
  
  let socialLinks = ''
  if (websiteUrl) socialLinks += `<a href="${websiteUrl}" style="color: #3B82F6; text-decoration: none; margin: 0 8px;">Website</a>`
  if (instagramUrl) socialLinks += `<a href="${instagramUrl}" style="color: #3B82F6; text-decoration: none; margin: 0 8px;">Instagram</a>`
  if (facebookUrl) socialLinks += `<a href="${facebookUrl}" style="color: #3B82F6; text-decoration: none; margin: 0 8px;">Facebook</a>`
  if (linkedinUrl) socialLinks += `<a href="${linkedinUrl}" style="color: #3B82F6; text-decoration: none; margin: 0 8px;">LinkedIn</a>`
  
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${user.id}`
  
  return `
    <div style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 32px 24px; text-align: center; margin-top: 32px;">
      <div style="font-size: 12px; color: #6B7280; line-height: 1.8;">
        <p style="font-weight: 600; color: #1F2937; margin: 0 0 8px 0; font-size: 14px;">${companyName}</p>
        <p style="margin: 0 0 4px 0;">${description}</p>
        <p style="margin: 0 0 12px 0;">${address} | ${supportEmail}</p>
        <div style="margin: 16px 0;">
          ${socialLinks}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline; font-size: 11px;">
            Unsubscribe dari email ini
          </a>
        </div>
        <p style="color: #9CA3AF; margin: 12px 0 0 0; font-size: 11px;">© ${currentYear} ${copyrightText}</p>
      </div>
    </div>
  `
}

/**
 * Replace shortcodes in content
 */
function replaceShortcodes(content: string, user: any): string {
  const membershipName = user.userMemberships?.[0]?.membership?.name || 'Free'
  const lastTransaction = user.transactions?.[0] // Assuming most recent transaction
  
  // Format helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  return content
    // User info
    .replace(/\{name\}/g, user.name || 'Member')
    .replace(/\{email\}/g, user.email || '')
    .replace(/\{role\}/g, user.role || '')
    .replace(/\{phone\}/g, user.phone || user.whatsapp || '')
    .replace(/\{whatsapp\}/g, user.whatsapp || '')
    
    // Membership
    .replace(/\{membership_plan\}/g, membershipName)
    .replace(/\{membership_status\}/g, user.userMemberships?.[0]?.status || 'INACTIVE')
    
    // Transaction - Basic Info
    .replace(/\{transaction_id\}/g, lastTransaction?.id || '-')
    .replace(/\{invoice_number\}/g, lastTransaction?.invoiceNumber || '-')
    .replace(/\{amount\}/g, lastTransaction?.amount ? formatCurrency(lastTransaction.amount) : '-')
    .replace(/\{payment_method\}/g, lastTransaction?.paymentMethod || '-')
    .replace(/\{payment_status\}/g, lastTransaction?.status || '-')
    
    // Transaction - Dates
    .replace(/\{transaction_date\}/g, formatDate(lastTransaction?.createdAt))
    .replace(/\{paid_at\}/g, formatDate(lastTransaction?.paidAt))
    .replace(/\{expiry_date\}/g, formatDate(lastTransaction?.expiredAt))
    
    // Transaction - Related Items
    .replace(/\{product_name\}/g, lastTransaction?.product?.name || '-')
    .replace(/\{course_name\}/g, lastTransaction?.course?.title || '-')
    .replace(/\{membership_type\}/g, lastTransaction?.membership?.membership?.name || '-')
    
    // Links
    .replace(/\{dashboard_link\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
    .replace(/\{profile_link\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/profile`)
    .replace(/\{support_link\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/support`)
    .replace(/\{invoice_link\}/g, lastTransaction?.id ? `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${lastTransaction.id}` : '#')
    .replace(/\{payment_link\}/g, lastTransaction?.id ? `${process.env.NEXT_PUBLIC_APP_URL}/payment/${lastTransaction.id}` : '#')
    .replace(/\{unsubscribe_link\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${user.id}`)
    
    // Company & Date
    .replace(/\{company_name\}/g, 'EksporYuk')
    .replace(/\{year\}/g, new Date().getFullYear().toString())
    .replace(/\{date\}/g, new Date().toLocaleDateString('id-ID'))
}
