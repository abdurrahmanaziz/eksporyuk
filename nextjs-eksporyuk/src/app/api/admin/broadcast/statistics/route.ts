import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/broadcast/statistics
 * Get broadcast statistics with time range filtering
 * ADMIN ONLY
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get campaigns in date range
    const campaigns = await prisma.broadcastCampaign.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get previous period for trends
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - days)
    
    const prevCampaigns = await prisma.broadcastCampaign.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lt: startDate
        }
      }
    })

    // Calculate totals
    const total = {
      campaigns: campaigns.length,
      sent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
      delivered: campaigns.reduce((sum, c) => sum + (c.sentCount - c.failedCount), 0),
      opened: campaigns.reduce((sum, c) => sum + c.openedCount, 0),
      clicked: campaigns.reduce((sum, c) => sum + c.clickedCount, 0),
      failed: campaigns.reduce((sum, c) => sum + c.failedCount, 0),
    }

    // Calculate previous totals for trends
    const prevTotal = {
      campaigns: prevCampaigns.length,
      sent: prevCampaigns.reduce((sum, c) => sum + c.sentCount, 0),
      opened: prevCampaigns.reduce((sum, c) => sum + c.openedCount, 0),
      clicked: prevCampaigns.reduce((sum, c) => sum + c.clickedCount, 0),
    }

    // Calculate trends (percentage change)
    const trends = {
      campaigns: prevTotal.campaigns > 0 
        ? Math.round(((total.campaigns - prevTotal.campaigns) / prevTotal.campaigns) * 100)
        : 0,
      sent: prevTotal.sent > 0 
        ? Math.round(((total.sent - prevTotal.sent) / prevTotal.sent) * 100)
        : 0,
      opened: prevTotal.opened > 0 
        ? Math.round(((total.opened - prevTotal.opened) / prevTotal.opened) * 100)
        : 0,
      clicked: prevTotal.clicked > 0 
        ? Math.round(((total.clicked - prevTotal.clicked) / prevTotal.clicked) * 100)
        : 0,
    }

    // Calculate rates
    const rates = {
      delivery: total.sent > 0 ? Math.round((total.delivered / total.sent) * 100) : 0,
      open: total.sent > 0 ? Math.round((total.opened / total.sent) * 100) : 0,
      click: total.opened > 0 ? Math.round((total.clicked / total.opened) * 100) : 0,
      failure: total.sent > 0 ? Math.round((total.failed / total.sent) * 100) : 0,
    }

    // Stats by channel
    const byChannel = {
      EMAIL: {
        sent: 0,
        opened: 0,
        clicked: 0,
      },
      WHATSAPP: {
        sent: 0,
        delivered: 0,
        read: 0,
      },
      BOTH: {
        sent: 0,
        opened: 0,
        clicked: 0,
      }
    }

    campaigns.forEach(campaign => {
      if (campaign.type === 'EMAIL') {
        byChannel.EMAIL.sent += campaign.sentCount
        byChannel.EMAIL.opened += campaign.openedCount
        byChannel.EMAIL.clicked += campaign.clickedCount
      } else if (campaign.type === 'WHATSAPP') {
        byChannel.WHATSAPP.sent += campaign.sentCount
        byChannel.WHATSAPP.delivered += campaign.sentCount - campaign.failedCount
        byChannel.WHATSAPP.read += campaign.openedCount
      } else if (campaign.type === 'BOTH') {
        byChannel.BOTH.sent += campaign.sentCount
        byChannel.BOTH.opened += campaign.openedCount
        byChannel.BOTH.clicked += campaign.clickedCount
      }
    })

    // Recent campaigns (top 10 by sent date)
    const recent = campaigns
      .filter(c => c.sentAt)
      .sort((a, b) => {
        const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0
        const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        emailSubject: c.emailSubject,
        sentCount: c.sentCount,
        openedCount: c.openedCount,
        clickedCount: c.clickedCount,
        failedCount: c.failedCount,
        sentAt: c.sentAt,
        createdAt: c.createdAt,
      }))

    return NextResponse.json({
      success: true,
      statistics: {
        total,
        rates,
        byChannel,
        recent,
        trends,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        }
      }
    })
  } catch (error: any) {
    console.error('[BROADCAST_STATISTICS] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
