/**
 * Support Ticket Notification Service
 * Handles realtime notifications via Pusher and email via Mailketing
 */

import { pusherService } from '@/lib/pusher'
import { sendBrandedEmail } from '@/lib/branded-template-helpers'
import { prisma } from '@/lib/prisma'

interface TicketNotificationData {
  ticketId: string
  ticketNumber: string
  title: string
  category: string
  status?: string
  priority?: string
  message?: string
  senderName?: string
  senderRole?: string
}

interface UserInfo {
  id: string
  email: string
  name: string
}

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT_LOGIN: 'Akun & Login',
  MEMBERSHIP_PAYMENT: 'Membership & Pembayaran',
  COURSE: 'Kelas',
  AFFILIATE: 'Affiliate',
  ADS_TRACKING: 'Iklan & Tracking',
  BUG_SYSTEM: 'Bug Sistem',
  OTHER: 'Lainnya'
}

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Sedang Diproses',
  WAITING_USER: 'Menunggu Anda',
  RESOLVED: 'Selesai',
  CLOSED: 'Ditutup'
}

class TicketNotificationService {
  /**
   * Notify when a new ticket is created
   */
  async notifyTicketCreated(ticket: TicketNotificationData, user: UserInfo) {
    try {
      // 1. Realtime notification to admins via Pusher
      await pusherService.trigger('admin-support', 'ticket-created', {
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        userName: user.name,
        userEmail: user.email,
        createdAt: new Date().toISOString()
      })

      // 2. In-app notification to admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, name: true }
      })

      for (const admin of admins) {
        // Create in-app notification
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Tiket Baru',
            message: `Tiket baru #${ticket.ticketNumber}: ${ticket.title}`,
            type: 'SUPPORT_TICKET',
            data: JSON.stringify({
              ticketId: ticket.ticketId,
              ticketNumber: ticket.ticketNumber
            }),
            link: `/admin/support/${ticket.ticketId}`
          }
        })

        // Pusher notification to specific admin
        await pusherService.notifyUser(admin.id, 'notification', {
          type: 'new-support-ticket',
          title: 'Tiket Support Baru',
          message: `${user.name} membuat tiket: ${ticket.title}`,
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber
        })
      }

      // 3. Email confirmation to user
      await this.sendTicketCreatedEmail(ticket, user)

      console.log(`[TICKET_NOTIFICATION] Ticket created notifications sent: ${ticket.ticketNumber}`)
    } catch (error) {
      console.error('[TICKET_NOTIFICATION] Error notifying ticket created:', error)
    }
  }

  /**
   * Notify when someone replies to a ticket
   */
  async notifyTicketReply(
    ticket: TicketNotificationData, 
    recipient: UserInfo, 
    isAdminReply: boolean
  ) {
    try {
      // 1. Realtime notification via Pusher
      const channel = isAdminReply ? `user-${recipient.id}` : 'admin-support'
      await pusherService.trigger(channel, 'ticket-reply', {
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        senderName: ticket.senderName,
        isAdminReply,
        createdAt: new Date().toISOString()
      })

      // 2. In-app notification
      await prisma.notification.create({
        data: {
          userId: recipient.id,
          title: isAdminReply ? 'Balasan Tiket' : 'Balasan dari User',
          message: `${ticket.senderName} membalas tiket #${ticket.ticketNumber}`,
          type: 'SUPPORT_TICKET',
          data: JSON.stringify({
            ticketId: ticket.ticketId,
            ticketNumber: ticket.ticketNumber
          }),
          link: isAdminReply 
            ? `/dashboard/bantuan/${ticket.ticketId}` 
            : `/admin/support/${ticket.ticketId}`
        }
      })

      // Pusher notification
      await pusherService.notifyUser(recipient.id, 'notification', {
        type: 'ticket-reply',
        title: isAdminReply ? 'Balasan Tiket Support' : 'Balasan Tiket dari User',
        message: `${ticket.senderName} membalas tiket: ${ticket.title}`,
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber
      })

      // 3. Send email notification
      await this.sendTicketReplyEmail(ticket, recipient, isAdminReply)

      console.log(`[TICKET_NOTIFICATION] Reply notification sent: ${ticket.ticketNumber}`)
    } catch (error) {
      console.error('[TICKET_NOTIFICATION] Error notifying ticket reply:', error)
    }
  }

  /**
   * Notify when ticket status changes
   */
  async notifyStatusChange(
    ticket: TicketNotificationData, 
    user: UserInfo, 
    oldStatus: string, 
    newStatus: string
  ) {
    try {
      // 1. Realtime notification via Pusher
      await pusherService.notifyUser(user.id, 'ticket-status-change', {
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        oldStatus,
        newStatus,
        statusLabel: STATUS_LABELS[newStatus] || newStatus
      })

      // 2. In-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Status Tiket Berubah',
          message: `Tiket #${ticket.ticketNumber} diubah ke ${STATUS_LABELS[newStatus] || newStatus}`,
          type: 'SUPPORT_TICKET',
          data: JSON.stringify({
            ticketId: ticket.ticketId,
            ticketNumber: ticket.ticketNumber,
            oldStatus,
            newStatus
          }),
          link: `/dashboard/bantuan/${ticket.ticketId}`
        }
      })

      // Pusher notification
      await pusherService.notifyUser(user.id, 'notification', {
        type: 'ticket-status-change',
        title: 'Status Tiket Berubah',
        message: `Tiket #${ticket.ticketNumber}: ${STATUS_LABELS[newStatus] || newStatus}`,
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber
      })

      // 3. Send email notification
      await this.sendStatusChangeEmail(ticket, user, oldStatus, newStatus)

      console.log(`[TICKET_NOTIFICATION] Status change notification sent: ${ticket.ticketNumber}`)
    } catch (error) {
      console.error('[TICKET_NOTIFICATION] Error notifying status change:', error)
    }
  }

  /**
   * Notify when ticket is resolved
   */
  async notifyTicketResolved(ticket: TicketNotificationData, user: UserInfo) {
    try {
      // 1. Realtime notification
      await pusherService.notifyUser(user.id, 'ticket-resolved', {
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title
      })

      // 2. In-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Tiket Selesai',
          message: `Tiket #${ticket.ticketNumber} telah diselesaikan`,
          type: 'SUPPORT_TICKET',
          data: JSON.stringify({
            ticketId: ticket.ticketId,
            ticketNumber: ticket.ticketNumber
          }),
          link: `/dashboard/bantuan/${ticket.ticketId}`
        }
      })

      // Pusher notification
      await pusherService.notifyUser(user.id, 'notification', {
        type: 'ticket-resolved',
        title: 'Tiket Selesai',
        message: `Tiket #${ticket.ticketNumber} telah diselesaikan`,
        ticketId: ticket.ticketId,
        ticketNumber: ticket.ticketNumber
      })

      // 3. Send email notification
      await this.sendTicketResolvedEmail(ticket, user)

      console.log(`[TICKET_NOTIFICATION] Resolved notification sent: ${ticket.ticketNumber}`)
    } catch (error) {
      console.error('[TICKET_NOTIFICATION] Error notifying ticket resolved:', error)
    }
  }

  // ============================================
  // EMAIL METHODS - Using sendBrandedEmail helper
  // ============================================

  private async sendTicketCreatedEmail(ticket: TicketNotificationData, user: UserInfo) {
    try {
      const baseUrl = (process.env.NEXTAUTH_URL || 'https://eksporyuk.com').trim()
      const result = await sendBrandedEmail({
        templateSlug: 'support-ticket-created',
        recipientEmail: user.email,
        recipientName: user.name,
        data: {
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          ticketCategory: CATEGORY_LABELS[ticket.category] || ticket.category,
          ticketMessage: ticket.message || '',
          ticketUrl: `${baseUrl}/dashboard/bantuan/${ticket.ticketId}`,
          createdAt: new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        userId: user.id
      })

      if (result.success) {
        console.log(`[TICKET_EMAIL] Created email sent to ${user.email}`)
      } else {
        console.error(`[TICKET_EMAIL] Failed to send created email: ${result.error}`)
      }
    } catch (error) {
      console.error('[TICKET_EMAIL] Error sending ticket created email:', error)
    }
  }

  private async sendTicketReplyEmail(
    ticket: TicketNotificationData, 
    recipient: UserInfo, 
    isAdminReply: boolean
  ) {
    try {
      const templateSlug = isAdminReply ? 'support-ticket-admin-reply' : 'support-ticket-user-reply'
      const baseUrl = (process.env.NEXTAUTH_URL || 'https://eksporyuk.com').trim()
      
      const result = await sendBrandedEmail({
        templateSlug,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        data: {
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          senderName: ticket.senderName || (isAdminReply ? 'Tim Support' : 'User'),
          replyMessage: ticket.message || '',
          ticketUrl: isAdminReply 
            ? `${baseUrl}/dashboard/bantuan/${ticket.ticketId}`
            : `${baseUrl}/admin/support/${ticket.ticketId}`,
          repliedAt: new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        userId: recipient.id
      })

      if (result.success) {
        console.log(`[TICKET_EMAIL] Reply email sent to ${recipient.email}`)
      } else {
        console.error(`[TICKET_EMAIL] Failed to send reply email: ${result.error}`)
      }
    } catch (error) {
      console.error('[TICKET_EMAIL] Error sending reply email:', error)
    }
  }

  private async sendStatusChangeEmail(
    ticket: TicketNotificationData, 
    user: UserInfo, 
    oldStatus: string, 
    newStatus: string
  ) {
    try {
      const result = await sendBrandedEmail({
        templateSlug: 'support-ticket-status-change',
        recipientEmail: user.email,
        recipientName: user.name,
        data: {
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          oldStatus: STATUS_LABELS[oldStatus] || oldStatus,
          newStatus: STATUS_LABELS[newStatus] || newStatus,
          ticketUrl: `${(process.env.NEXTAUTH_URL || 'https://eksporyuk.com').trim()}/dashboard/bantuan/${ticket.ticketId}`,
          changedAt: new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        userId: user.id
      })

      if (result.success) {
        console.log(`[TICKET_EMAIL] Status change email sent to ${user.email}`)
      } else {
        console.error(`[TICKET_EMAIL] Failed to send status change email: ${result.error}`)
      }
    } catch (error) {
      console.error('[TICKET_EMAIL] Error sending status change email:', error)
    }
  }

  private async sendTicketResolvedEmail(ticket: TicketNotificationData, user: UserInfo) {
    try {
      const baseUrl = (process.env.NEXTAUTH_URL || 'https://eksporyuk.com').trim()
      const result = await sendBrandedEmail({
        templateSlug: 'support-ticket-resolved',
        recipientEmail: user.email,
        recipientName: user.name,
        data: {
          ticketNumber: ticket.ticketNumber,
          ticketTitle: ticket.title,
          ticketUrl: `${baseUrl}/dashboard/bantuan/${ticket.ticketId}`,
          resolvedAt: new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        userId: user.id
      })

      if (result.success) {
        console.log(`[TICKET_EMAIL] Resolved email sent to ${user.email}`)
      } else {
        console.error(`[TICKET_EMAIL] Failed to send resolved email: ${result.error}`)
      }
    } catch (error) {
      console.error('[TICKET_EMAIL] Error sending resolved email:', error)
    }
  }
}

export const ticketNotificationService = new TicketNotificationService()
export default ticketNotificationService
