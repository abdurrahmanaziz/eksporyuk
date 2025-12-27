import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/support/stats
 * Get support ticket statistics - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts by status
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingUserTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      highPriorityTickets
    ] = await Promise.all([
      prisma.support_tickets.count(),
      prisma.support_tickets.count({ where: { status: 'OPEN' } }),
      prisma.support_tickets.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.support_tickets.count({ where: { status: 'WAITING_USER' } }),
      prisma.support_tickets.count({ where: { status: 'RESOLVED' } }),
      prisma.support_tickets.count({ where: { status: 'CLOSED' } }),
      prisma.support_tickets.count({ where: { priority: 'URGENT' } }),
      prisma.support_tickets.count({ where: { priority: 'HIGH' } })
    ])

    // Tickets by category
    const ticketsByCategory = await prisma.support_tickets.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    // Recent tickets (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentTickets = await prisma.support_tickets.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Average response time (in hours)
    // Find tickets that have admin responses by querying messages first
    const ticketsWithAdminMessages = await prisma.support_ticket_messages.findMany({
      where: {
        senderRole: 'ADMIN'
      },
      select: {
        ticketId: true
      },
      distinct: ['ticketId'],
      take: 100
    })

    const ticketIdsWithResponse = ticketsWithAdminMessages.map(m => m.ticketId)

    let totalResponseTime = 0
    let responseCount = 0

    if (ticketIdsWithResponse.length > 0) {
      // Get messages for these tickets
      const allMessages = await prisma.support_ticket_messages.findMany({
        where: {
          ticketId: { in: ticketIdsWithResponse }
        },
        orderBy: { createdAt: 'asc' }
      })

      // Group messages by ticketId
      const messagesByTicket = new Map<string, typeof allMessages>()
      for (const msg of allMessages) {
        if (!messagesByTicket.has(msg.ticketId)) {
          messagesByTicket.set(msg.ticketId, [])
        }
        messagesByTicket.get(msg.ticketId)!.push(msg)
      }

      // Calculate response times
      messagesByTicket.forEach((messages) => {
        if (messages.length >= 2) {
          const firstMessage = messages[0]
          const firstResponse = messages.find(m => m.senderRole === 'ADMIN')
          if (firstResponse) {
            const responseTime = firstResponse.createdAt.getTime() - firstMessage.createdAt.getTime()
            totalResponseTime += responseTime / (1000 * 60 * 60) // Convert to hours
            responseCount++
          }
        }
      })
    }

    const avgResponseTimeHours = responseCount > 0
      ? (totalResponseTime / responseCount).toFixed(2)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          waitingUser: waitingUserTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          urgent: urgentTickets,
          highPriority: highPriorityTickets,
          recentTickets,
          avgResponseTimeHours
        },
        byCategory: ticketsByCategory.map(cat => ({
          category: cat.category,
          count: cat._count
        }))
      }
    })
  } catch (error) {
    console.error('[GET /api/support/stats] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat statistik' },
      { status: 500 }
    )
  }
}
