import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch detailed stats for broadcast
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const broadcast = await prisma.affiliateBroadcast.findUnique({
      where: {
        id: params.id,
        affiliateId: affiliate.id,
      },
      include: {
        logs: {
          select: {
            status: true,
            sentAt: true,
            deliveredAt: true,
            openedAt: true,
            clickedAt: true,
            failedAt: true,
          },
        },
      },
    })

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Calculate stats
    const stats = {
      total: broadcast.logs.length,
      sent: broadcast.logs.filter(log => log.sentAt).length,
      delivered: broadcast.logs.filter(log => log.deliveredAt).length,
      opened: broadcast.logs.filter(log => log.openedAt).length,
      clicked: broadcast.logs.filter(log => log.clickedAt).length,
      failed: broadcast.logs.filter(log => log.failedAt).length,
      pending: broadcast.logs.filter(log => log.status === 'PENDING').length,
    }

    // Calculate rates
    const rates = {
      deliveryRate: stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(2) : '0',
      openRate: stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(2) : '0',
      clickRate: stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(2) : '0',
      failureRate: stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(2) : '0',
    }

    // Timeline data (hourly breakdown for last 24h)
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const timelineData = broadcast.logs
      .filter(log => log.sentAt && new Date(log.sentAt) >= last24h)
      .reduce((acc, log) => {
        if (log.sentAt) {
          const hour = new Date(log.sentAt).getHours()
          acc[hour] = (acc[hour] || 0) + 1
        }
        return acc
      }, {} as Record<number, number>)

    return NextResponse.json({
      stats,
      rates,
      timeline: timelineData,
      broadcast: {
        id: broadcast.id,
        name: broadcast.name,
        status: broadcast.status,
        creditUsed: broadcast.creditUsed,
        sentAt: broadcast.sentAt,
      },
    })
  } catch (error) {
    console.error('Error fetching broadcast stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
