import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
    }

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
    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: params.id,
        senderId: session.user.id,
        senderRole: session.user.role as any,
        message: validated.message,
        attachments: validated.attachments || [],
        isSystemMessage: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    // Update ticket status if user replies (change from WAITING_USER to IN_PROGRESS)
    if (ticket.userId === session.user.id && ticket.status === 'WAITING_USER') {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // If admin replies and status is OPEN, change to IN_PROGRESS
    if (session.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // TODO: Send notification to ticket owner if admin replied
    // TODO: Send notification to admin if user replied

    return NextResponse.json({
      success: true,
      data: message,
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
