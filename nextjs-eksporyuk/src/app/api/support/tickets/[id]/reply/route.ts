import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ticketNotificationService } from '@/lib/services/ticket-notification-service'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

export const dynamic = 'force-dynamic'

type Props = {
  params: { id: string }
}

const replySchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
  attachments: z.array(z.string()).optional()
})

/**
 * POST /api/support/tickets/[id]/reply
 * Add reply message to ticket
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ticket exists and user has access
    const ticket = await prisma.support_tickets.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        status: true,
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    // Fetch ticket user manually
    const ticketUser = await prisma.user.findUnique({
      where: { id: ticket.userId },
      select: { id: true, email: true, name: true }
    })

    // Security: Only ticket owner or admin can reply
    if (session.user.role !== 'ADMIN' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Cannot reply to closed tickets
    if (ticket.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Tidak bisa membalas tiket yang sudah ditutup' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = replySchema.parse(body)

    // Create message
    const message = await prisma.support_ticket_messages.create({
      data: {
        id: createId(),
        ticketId: params.id,
        senderId: session.user.id,
        senderRole: session.user.role as any,
        message: validated.message,
        attachments: validated.attachments || [],
        isSystemMessage: false,
        updatedAt: new Date(),
      }
    })

    // Manually fetch sender
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true
      }
    })

    const enrichedMessage = {
      ...message,
      sender
    }

    // Update ticket status if user replies (change from WAITING_USER to IN_PROGRESS)
    if (ticket.userId === session.user.id && ticket.status === 'WAITING_USER') {
      await prisma.support_tickets.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // If admin replies and status is OPEN, change to IN_PROGRESS
    if (session.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      await prisma.support_tickets.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // Get full ticket info for notification
    const fullTicket = await prisma.support_tickets.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        category: true
      }
    })

    // Send notification based on who replied
    const isAdminReply = session.user.role === 'ADMIN'
    
    if (isAdminReply) {
      // Admin replied - notify the ticket owner
      ticketNotificationService.notifyTicketReply(
        {
          ticketId: params.id,
          ticketNumber: fullTicket?.ticketNumber || '',
          title: fullTicket?.title || '',
          category: fullTicket?.category || '',
          message: validated.message,
          senderName: session.user.name || 'Tim Support',
          senderRole: 'ADMIN'
        },
        {
          id: ticketUser?.id || '',
          email: ticketUser?.email || '',
          name: ticketUser?.name || 'User'
        },
        true
      ).catch(err => console.error('[TICKET_REPLY] Notification error:', err))
    } else {
      // User replied - notify admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, name: true }
      })
      
      for (const admin of admins) {
        ticketNotificationService.notifyTicketReply(
          {
            ticketId: params.id,
            ticketNumber: fullTicket?.ticketNumber || '',
            title: fullTicket?.title || '',
            category: fullTicket?.category || '',
            message: validated.message,
            senderName: session.user.name || 'User',
            senderRole: session.user.role
          },
          {
            id: admin.id,
            email: admin.email!,
            name: admin.name || 'Admin'
          },
          false
        ).catch(err => console.error('[TICKET_REPLY] Notification error:', err))
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedMessage,
      message: 'Balasan berhasil dikirim'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error(`[POST /api/support/tickets/${params.id}/reply] Error:`, error)
    return NextResponse.json(
      { error: 'Gagal mengirim balasan' },
      { status: 500 }
    )
  }
}
