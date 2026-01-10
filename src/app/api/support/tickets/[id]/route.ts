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

/**
 * GET /api/support/tickets/[id]
 * Get single ticket with all messages
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.support_tickets.findUnique({
      where: { id: params.id }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    // Security: Regular users can only view their own tickets
    if (session.user.role !== 'ADMIN' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Manually fetch related data
    const [ticketUser, ticketAssignedTo, messages] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ticket.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true
        }
      }),
      ticket.assignedToId ? prisma.user.findUnique({
        where: { id: ticket.assignedToId },
        select: {
          id: true,
          name: true,
          email: true
        }
      }) : null,
      prisma.support_ticket_messages.findMany({
        where: { ticketId: params.id },
        orderBy: { createdAt: 'asc' }
      })
    ])

    // Fetch senders for messages
    const senderIds = messages.map(m => m.senderId).filter(Boolean)
    const senders = senderIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true
      }
    }) : []

    const senderMap = new Map(senders.map(s => [s.id, s]))

    const enrichedTicket = {
      ...ticket,
      user: ticketUser,
      assignedTo: ticketAssignedTo,
      messages: messages.map(msg => ({
        ...msg,
        sender: senderMap.get(msg.senderId) || null
      }))
    }

    return NextResponse.json({
      success: true,
      data: enrichedTicket
    })
  } catch (error) {
    console.error(`[GET /api/support/tickets/${params.id}] Error:`, error)
    return NextResponse.json(
      { error: 'Gagal memuat tiket' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/support/tickets/[id]
 * Update ticket (status, priority, assign) - Admin only
 */
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ticket and validate access
    const existingTicket = await prisma.support_tickets.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        category: true,
        status: true,
        priority: true,
        userId: true,
        assignedToId: true,
      }
    })

    if (!existingTicket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    // Fetch user and assignedTo manually
    const [ticketUser, ticketAssignedTo] = await Promise.all([
      prisma.user.findUnique({ where: { id: existingTicket.userId }, select: { id: true, name: true, email: true } }),
      existingTicket.assignedToId ? prisma.user.findUnique({ where: { id: existingTicket.assignedToId }, select: { id: true, name: true, email: true } }) : null
    ])

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = session.user.id === existingTicket.userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { status, priority, assignedToId } = body

    const updateData: any = {}
    let systemMessage = ''

    // Owner can only close their own ticket
    if (!isAdmin) {
      if (status !== 'CLOSED') {
        return NextResponse.json({ error: 'Hanya bisa menutup tiket' }, { status: 400 })
      }

      updateData.status = 'CLOSED'
      updateData.closedAt = new Date()
      systemMessage = 'Tiket ditutup oleh pengguna.'
    } else {
      if (status) {
        updateData.status = status
        systemMessage += `Status diubah menjadi ${status}. `
        
        if (status === 'RESOLVED') {
          updateData.resolvedAt = new Date()
        } else if (status === 'CLOSED') {
          updateData.closedAt = new Date()
        }
      }

      if (priority) {
        updateData.priority = priority
        systemMessage += `Prioritas diubah menjadi ${priority}. `
      }

      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId
        updateData.assignedAt = assignedToId ? new Date() : null
        
        if (assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { name: true }
          })
          systemMessage += `Tiket di-assign ke ${assignedUser?.name}. `
        } else {
          systemMessage += `Assignment dihapus. `
        }
      }
    }

    // Update ticket
    const ticket = await prisma.support_tickets.update({
      where: { id: params.id },
      data: updateData
    })

    // Manually fetch user and assignedTo
    const [user, assignedTo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ticket.userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      }),
      ticket.assignedToId ? prisma.user.findUnique({
        where: { id: ticket.assignedToId },
        select: {
          id: true,
          name: true,
          email: true
        }
      }) : null
    ])

    const enrichedTicket = {
      ...ticket,
      user,
      assignedTo
    }

    // Add system message
    if (systemMessage) {
      await prisma.support_ticket_messages.create({
        data: {
          id: createId(),
          ticketId: params.id,
          senderId: session.user.id,
          senderRole: 'ADMIN',
          message: systemMessage.trim(),
          isSystemMessage: true,
          updatedAt: new Date(),
        }
      })
    }

    // Send notification to user if status changed
    const oldStatus = existingTicket.status
    const newStatus = enrichedTicket.status

    if (newStatus && newStatus !== oldStatus) {
      if (newStatus === 'RESOLVED') {
        ticketNotificationService.notifyTicketResolved(
          {
            ticketId: params.id,
            ticketNumber: enrichedTicket.ticketNumber,
            title: enrichedTicket.title,
            category: enrichedTicket.category
          },
          {
            id: enrichedTicket.user!.id,
            email: enrichedTicket.user!.email,
            name: enrichedTicket.user!.name || 'User'
          }
        ).catch(err => console.error('[TICKET_UPDATE] Notification error:', err))
      } else {
        ticketNotificationService.notifyStatusChange(
          {
            ticketId: params.id,
            ticketNumber: enrichedTicket.ticketNumber,
            title: enrichedTicket.title,
            category: enrichedTicket.category,
            status: newStatus
          },
          {
            id: enrichedTicket.user!.id,
            email: enrichedTicket.user!.email,
            name: enrichedTicket.user!.name || 'User'
          },
          oldStatus,
          newStatus
        ).catch(err => console.error('[TICKET_UPDATE] Notification error:', err))
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedTicket,
      message: 'Tiket berhasil diupdate'
    })
  } catch (error) {
    console.error(`[PATCH /api/support/tickets/${params.id}] Error:`, error)
    return NextResponse.json(
      { error: 'Gagal mengupdate tiket' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/support/tickets/[id]
 * Delete ticket - Admin only (soft delete by closing)
 */
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Instead of hard delete, just close the ticket
    await prisma.support_tickets.update({
      where: { id: params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil ditutup'
    })
  } catch (error) {
    console.error(`[DELETE /api/support/tickets/${params.id}] Error:`, error)
    return NextResponse.json(
      { error: 'Gagal menghapus tiket' },
      { status: 500 }
    )
  }
}
