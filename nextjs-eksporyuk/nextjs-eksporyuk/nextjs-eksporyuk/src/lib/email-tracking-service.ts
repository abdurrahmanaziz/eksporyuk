/**
 * Email Tracking Service
 * Real-time tracking untuk semua commission email notifications
 * Tracks: sent, delivered, opened, clicked, bounced, failed
 */

import { prisma } from '@/lib/prisma'

export interface EmailNotificationParams {
  templateSlug: string
  templateCategory: string
  recipientId: string
  recipientEmail: string
  recipientName?: string
  recipientRole?: string
  subject: string
  variables?: Record<string, any>
  sourceType?: string
  sourceId?: string
  transactionId?: string
  metadata?: Record<string, any>
}

/**
 * Create email notification log entry
 * Called when email is about to be sent
 */
export async function createEmailLog(params: EmailNotificationParams) {
  try {
    const emailLog = await prisma.emailNotificationLog.create({
      data: {
        templateSlug: params.templateSlug,
        templateCategory: params.templateCategory,
        recipientId: params.recipientId,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        recipientRole: params.recipientRole,
        subject: params.subject,
        variables: params.variables ? JSON.stringify(params.variables) : null,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        transactionId: params.transactionId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        status: 'QUEUED',
        internalTrackingId: generateTrackingId()
      }
    })

    console.log(`📧 Email log created: ${emailLog.id} (${params.templateSlug} → ${params.recipientEmail})`)
    return emailLog
  } catch (error) {
    console.error('Error creating email log:', error)
    throw error
  }
}

/**
 * Update email status to PENDING (being sent)
 */
export async function updateEmailStatus(emailLogId: string, status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED') {
  try {
    const updated = await prisma.emailNotificationLog.update({
      where: { id: emailLogId },
      data: {
        status,
        ...(status === 'SENT' && { sentAt: new Date() }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() })
      }
    })
    return updated
  } catch (error) {
    console.error(`Error updating email status for ${emailLogId}:`, error)
    throw error
  }
}

/**
 * Mark email as sent with external message ID from provider
 */
export async function markEmailSent(emailLogId: string, externalMessageId?: string) {
  try {
    return await updateEmailStatus(emailLogId, 'SENT')
  } catch (error) {
    console.error('Error marking email as sent:', error)
    throw error
  }
}

/**
 * Mark email as delivered (webhook from Mailketing)
 */
export async function markEmailDelivered(
  externalMessageId: string,
  deliveredAt?: Date
) {
  try {
    const updated = await prisma.emailNotificationLog.update({
      where: { externalMessageId },
      data: {
        status: 'DELIVERED',
        deliveredAt: deliveredAt || new Date()
      }
    })
    console.log(`✅ Email delivered: ${updated.recipientEmail} (${updated.templateSlug})`)
    return updated
  } catch (error) {
    console.error('Error marking email as delivered:', error)
  }
}

/**
 * Mark email as opened (webhook from Mailketing)
 */
export async function markEmailOpened(
  internalTrackingId: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const log = await prisma.emailNotificationLog.findUnique({
      where: { internalTrackingId }
    })

    if (!log) {
      console.warn(`Email log not found: ${internalTrackingId}`)
      return null
    }

    const updated = await prisma.emailNotificationLog.update({
      where: { id: log.id },
      data: {
        openedAt: new Date(),
        openCount: log.openCount + 1,
        openIpAddress: ipAddress,
        openUserAgent: userAgent
      }
    })

    console.log(`👁️  Email opened: ${updated.recipientEmail} (${updated.templateSlug})`)
    return updated
  } catch (error) {
    console.error('Error marking email as opened:', error)
  }
}

/**
 * Mark email as clicked (webhook from Mailketing)
 */
export async function markEmailClicked(
  internalTrackingId: string,
  clickUrl?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const log = await prisma.emailNotificationLog.findUnique({
      where: { internalTrackingId }
    })

    if (!log) {
      console.warn(`Email log not found: ${internalTrackingId}`)
      return null
    }

    const updated = await prisma.emailNotificationLog.update({
      where: { id: log.id },
      data: {
        clickedAt: new Date(),
        clickCount: log.clickCount + 1,
        clickUrl,
        clickIpAddress: ipAddress,
        clickUserAgent: userAgent
      }
    })

    console.log(`🔗 Email clicked: ${updated.recipientEmail} → ${clickUrl || 'unknown'} (${updated.templateSlug})`)
    return updated
  } catch (error) {
    console.error('Error marking email as clicked:', error)
  }
}

/**
 * Mark email as failed
 */
export async function markEmailFailed(
  emailLogId: string,
  failureReason: string,
  retryCount: number = 0
) {
  try {
    const nextRetryAt = retryCount < 3 
      ? new Date(Date.now() + (Math.pow(2, retryCount) * 60 * 1000)) // exponential backoff
      : null

    const updated = await prisma.emailNotificationLog.update({
      where: { id: emailLogId },
      data: {
        status: retryCount < 3 ? 'QUEUED' : 'FAILED',
        failureReason,
        retryCount: retryCount + 1,
        nextRetryAt
      }
    })

    console.log(`❌ Email failed: ${updated.recipientEmail} (${updated.templateSlug}) - ${failureReason}`)
    return updated
  } catch (error) {
    console.error('Error marking email as failed:', error)
    throw error
  }
}

/**
 * Mark email as bounced
 */
export async function markEmailBounced(
  externalMessageId: string,
  bounceReason: string,
  bounceType: 'HARD' | 'SOFT' = 'HARD'
) {
  try {
    const updated = await prisma.emailNotificationLog.update({
      where: { externalMessageId },
      data: {
        status: bounceType === 'HARD' ? 'FAILED' : 'BOUNCED',
        bounceReason
      }
    })

    console.log(`📬 Email bounced (${bounceType}): ${updated.recipientEmail} - ${bounceReason}`)
    return updated
  } catch (error) {
    console.error('Error marking email as bounced:', error)
  }
}

/**
 * Mark email as spam reported
 */
export async function markEmailAsSpam(internalTrackingId: string) {
  try {
    const log = await prisma.emailNotificationLog.findUnique({
      where: { internalTrackingId }
    })

    if (!log) return null

    const updated = await prisma.emailNotificationLog.update({
      where: { id: log.id },
      data: { spamReported: true }
    })

    console.log(`🚨 Email reported as spam: ${updated.recipientEmail}`)
    return updated
  } catch (error) {
    console.error('Error marking email as spam:', error)
  }
}

/**
 * Get email statistics for dashboard
 */
export async function getEmailStatistics(
  templateSlug?: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  try {
    const where: any = {}
    if (templateSlug) where.templateSlug = templateSlug
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const logs = await prisma.emailNotificationLog.findMany({
      where,
      select: {
        id: true,
        status: true,
        openedAt: true,
        clickedAt: true,
        openCount: true,
        clickCount: true,
        createdAt: true
      }
    })

    const totalEmails = logs.length
    const sentEmails = logs.filter(l => ['SENT', 'DELIVERED', 'OPENED'].includes(l.status)).length
    const deliveredEmails = logs.filter(l => ['DELIVERED', 'OPENED'].includes(l.status)).length
    const openedEmails = logs.filter(l => l.openedAt !== null).length
    const clickedEmails = logs.filter(l => l.clickedAt !== null).length
    const failedEmails = logs.filter(l => l.status === 'FAILED').length
    const bouncedEmails = logs.filter(l => l.status === 'BOUNCED').length

    return {
      totalEmails,
      sentEmails,
      deliveryRate: totalEmails > 0 ? ((deliveredEmails / totalEmails) * 100).toFixed(2) + '%' : '0%',
      openRate: totalEmails > 0 ? ((openedEmails / totalEmails) * 100).toFixed(2) + '%' : '0%',
      clickRate: totalEmails > 0 ? ((clickedEmails / totalEmails) * 100).toFixed(2) + '%' : '0%',
      failedEmails,
      bouncedEmails,
      failureRate: totalEmails > 0 ? ((failedEmails / totalEmails) * 100).toFixed(2) + '%' : '0%'
    }
  } catch (error) {
    console.error('Error getting email statistics:', error)
    return null
  }
}

/**
 * Get recent email logs for dashboard view
 */
export async function getRecentEmailLogs(
  limit: number = 20,
  templateSlug?: string,
  status?: string
) {
  try {
    const where: any = {}
    if (templateSlug) where.templateSlug = templateSlug
    if (status) where.status = status

    return await prisma.emailNotificationLog.findMany({
      where,
      select: {
        id: true,
        templateSlug: true,
        recipientEmail: true,
        recipientName: true,
        subject: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  } catch (error) {
    console.error('Error getting recent email logs:', error)
    return []
  }
}

/**
 * Generate unique tracking ID for email
 */
function generateTrackingId(): string {
  return `trk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get email template preview data for testing
 */
export async function getEmailTemplate(templateSlug: string) {
  try {
    return await prisma.brandedTemplate.findFirst({
      where: { slug: templateSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        content: true,
        variables: true,
        ctaText: true,
        ctaLink: true
      }
    })
  } catch (error) {
    console.error('Error getting email template:', error)
    return null
  }
}

export default {
  createEmailLog,
  updateEmailStatus,
  markEmailSent,
  markEmailDelivered,
  markEmailOpened,
  markEmailClicked,
  markEmailFailed,
  markEmailBounced,
  markEmailAsSpam,
  getEmailStatistics,
  getRecentEmailLogs,
  getEmailTemplate
}
