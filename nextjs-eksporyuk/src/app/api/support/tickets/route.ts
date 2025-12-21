import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ticketNotificationService } from '@/lib/services/ticket-notification-service'

export const dynamic = 'force-dynamic'

// Validation schema
const createTicketSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(200),
  category: z.enum([
    'ACCOUNT_LOGIN',
    'MEMBERSHIP_PAYMENT',
    'COURSE',
    'AFFILIATE',
    'ADS_TRACKING',
    'BUG_SYSTEM',
    'OTHER'
  ]),
  message: z.string().min(10, 'Pesan minimal 10 karakter'),
  attachments: z.array(z.string()).optional(),
  relatedOrderId: z.string().optional(),
  relatedMembershipId: z.string().optional(),
  relatedCourseId: z.string().optional()
})

/**
 * GET /api/support/tickets
 * Get user's tickets (user) or all tickets (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    // Regular users only see their own tickets
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id
    }

    // Filters
    if (status) where.status = status
    if (priority) where.priority = priority
    if (category) where.category = category

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
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
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              message: true,
              createdAt: true,
              isSystemMessage: true
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: [
          { status: 'asc' }, // Open tickets first
          { priority: 'desc' }, // Urgent first
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.supportTicket.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('[GET /api/support/tickets] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat tiket' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/support/tickets
 * Create new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createTicketSchema.parse(body)

    // Generate ticket number: TICKET-YYYYMMDD-XXXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.supportTicket.count({
      where: {
        ticketNumber: {
          startsWith: `TICKET-${dateStr}-`
        }
      }
    })
    const ticketNumber = `TICKET-${dateStr}-${String(count + 1).padStart(4, '0')}`

    // Create ticket with first message
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: session.user.id,
        userRole: session.user.role as any,
        title: validated.title,
        category: validated.category as any,
        priority: 'MEDIUM',
        status: 'OPEN',
        relatedOrderId: validated.relatedOrderId,
        relatedMembershipId: validated.relatedMembershipId,
        relatedCourseId: validated.relatedCourseId,
        messages: {
          create: {
            senderId: session.user.id,
            senderRole: session.user.role as any,
            message: validated.message,
            attachments: validated.attachments || [],
            isSystemMessage: false
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    // Send notifications (async, don't wait)
    ticketNotificationService.notifyTicketCreated(
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        category: validated.category,
        priority: 'MEDIUM',
        message: validated.message
      },
      {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || 'User'
      }
    ).catch(err => console.error('[TICKET_CREATE] Notification error:', err))

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Tiket berhasil dibuat'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('[POST /api/support/tickets] Error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat tiket' },
      { status: 500 }
    )
  }
}
