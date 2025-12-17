import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    // Security: Regular users can only view their own tickets
    if (session.user.role !== 'ADMIN' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: ticket
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
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, priority, assignedToId } = body

    const updateData: any = {}
    let systemMessage = ''

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

    // Update ticket
    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Add system message
    if (systemMessage) {
      await prisma.supportTicketMessage.create({
        data: {
          ticketId: params.id,
          senderId: session.user.id,
          senderRole: 'ADMIN',
          message: systemMessage.trim(),
          isSystemMessage: true
        }
      })
    }

    // TODO: Send notification to user if status changed

    return NextResponse.json({
      success: true,
      data: ticket,
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
    await prisma.supportTicket.update({
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
