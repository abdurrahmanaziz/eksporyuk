/**
 * GET /api/admin/reminders/stats
 * Get reminder statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get('reminderId')
    const membershipId = searchParams.get('membershipId')
    const period = searchParams.get('period') || '30' // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Build where clause
    const where: any = {
      createdAt: { gte: startDate },
    }

    if (reminderId) {
      where.reminderId = reminderId
    }

    if (membershipId) {
      where.reminder = { membershipId }
    }

    // Get log statistics
    const [
      totalLogs,
      sentLogs,
      deliveredLogs,
      openedLogs,
      clickedLogs,
      failedLogs,
    ] = await Promise.all([
      prisma.reminderLog.count({ where }),
      prisma.reminderLog.count({ where: { ...where, status: 'SENT' } }),
      prisma.reminderLog.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.reminderLog.count({ where: { ...where, status: 'OPENED' } }),
      prisma.reminderLog.count({ where: { ...where, status: 'CLICKED' } }),
      prisma.reminderLog.count({ where: { ...where, status: 'FAILED' } }),
    ])

    // Calculate rates
    const deliveryRate = totalLogs > 0 ? ((sentLogs + deliveredLogs) / totalLogs) * 100 : 0
    const openRate = (sentLogs + deliveredLogs) > 0 ? (openedLogs / (sentLogs + deliveredLogs)) * 100 : 0
    const clickRate = (sentLogs + deliveredLogs) > 0 ? (clickedLogs / (sentLogs + deliveredLogs)) * 100 : 0
    const failureRate = totalLogs > 0 ? (failedLogs / totalLogs) * 100 : 0

    // Get channel breakdown
    const channelStats = await prisma.reminderLog.groupBy({
      by: ['channel'],
      where,
      _count: { id: true },
    })

    // Get recent logs
    const recentLogs = await prisma.reminderLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        reminder: {
          select: { title: true, membership: { select: { name: true } } },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    })

    // Get daily breakdown for chart
    const dailyStats = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM ReminderLog
      WHERE createdAt >= ${startDate}
      ${reminderId ? prisma.$queryRaw`AND reminderId = ${reminderId}` : prisma.$queryRaw``}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalLogs,
          sent: sentLogs,
          delivered: deliveredLogs,
          opened: openedLogs,
          clicked: clickedLogs,
          failed: failedLogs,
        },
        rates: {
          delivery: Math.round(deliveryRate * 100) / 100,
          open: Math.round(openRate * 100) / 100,
          click: Math.round(clickRate * 100) / 100,
          failure: Math.round(failureRate * 100) / 100,
        },
        channelBreakdown: channelStats.map((stat) => ({
          channel: stat.channel,
          count: stat._count.id,
        })),
        recentLogs: recentLogs.map((log) => ({
          id: log.id,
          reminderTitle: log.reminder?.title,
          membershipName: log.reminder?.membership?.name,
          userName: log.user?.name,
          userEmail: log.user?.email,
          channel: log.channel,
          status: log.status,
          scheduledAt: log.scheduledAt,
          sentAt: log.sentAt,
          errorMessage: log.errorMessage,
        })),
        dailyStats,
        period: parseInt(period),
      },
    })
  } catch (error: any) {
    console.error('[Admin Reminder Stats]', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
