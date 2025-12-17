import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
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
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'WAITING_USER' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      prisma.supportTicket.count({ where: { priority: 'URGENT' } }),
      prisma.supportTicket.count({ where: { priority: 'HIGH' } })
    ])

    // Tickets by category
    const ticketsByCategory = await prisma.supportTicket.groupBy({
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
    
    const recentTickets = await prisma.supportTicket.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Average response time (in hours)
    const ticketsWithResponse = await prisma.supportTicket.findMany({
      where: {
        messages: {
          some: {
            senderRole: 'ADMIN'
          }
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 2
        }
      },
      take: 100 // Sample last 100 tickets
    })

    let totalResponseTime = 0
    let responseCount = 0

    ticketsWithResponse.forEach(ticket => {
      if (ticket.messages.length >= 2) {
        const firstMessage = ticket.messages[0]
        const firstResponse = ticket.messages.find(m => m.senderRole === 'ADMIN')
        if (firstResponse) {
          const responseTime = firstResponse.createdAt.getTime() - firstMessage.createdAt.getTime()
          totalResponseTime += responseTime / (1000 * 60 * 60) // Convert to hours
          responseCount++
        }
      }
    })

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
