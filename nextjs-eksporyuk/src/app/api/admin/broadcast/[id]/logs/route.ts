import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/broadcast/[id]/logs
 * Get broadcast campaign logs for analytics
 * ADMIN ONLY
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const status = searchParams.get('status') // Filter by status
    const channel = searchParams.get('channel') // Filter by channel (EMAIL, WHATSAPP)

    // Build where clause
    const where: any = { campaignId: id }
    
    if (status) {
      where.status = status
    }
    
    if (channel) {
      where.channel = channel
    }

    // Fetch logs with user information
    const logs = await prisma.broadcastLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        channel: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        failedAt: true,
        errorMessage: true,
        createdAt: true
      }
    })

    // Get summary statistics
    const stats = await prisma.broadcastLog.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: true
    })

    const statusCounts = stats.reduce((acc: any, stat: any) => {
      acc[stat.status] = stat._count
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      logs,
      stats: statusCounts,
      total: logs.length
    })
  } catch (error: any) {
    console.error('[BROADCAST_LOGS_GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
