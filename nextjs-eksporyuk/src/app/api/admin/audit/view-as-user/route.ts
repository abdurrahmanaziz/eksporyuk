import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/audit/view-as-user
 * 
 * Menampilkan log audit untuk aktivitas admin view-as-user
 * Hanya admin yang dapat mengakses endpoint ini
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verifikasi admin authentication
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const adminId = searchParams.get('adminId')
    const targetUserId = searchParams.get('targetUserId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    console.log('[AUDIT-LOG] Fetching view-as-user audit logs:', {
      page,
      limit,
      adminId,
      targetUserId,
      dateFrom,
      dateTo
    })

    // 3. Build filter conditions
    const whereConditions: any = {
      action: {
        in: [
          'ADMIN_VIEW_AS_USER_START',
          'ADMIN_VIEW_AS_USER_END',
          'ADMIN_USER_SEARCH'
        ]
      }
    }

    if (adminId) {
      whereConditions.userId = adminId
    }

    if (targetUserId) {
      whereConditions.entityId = targetUserId
    }

    if (dateFrom || dateTo) {
      whereConditions.createdAt = {}
      if (dateFrom) {
        whereConditions.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereConditions.createdAt.lte = new Date(dateTo)
      }
    }

    // 4. Fetch audit logs with user details
    const [logs, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          // Note: ActivityLog doesn't have relations in schema, 
          // so we'll fetch user details separately
        }
      }),
      prisma.activityLog.count({
        where: whereConditions
      })
    ])

    // 5. Get unique user IDs for fetching user details
    const adminIds = [...new Set(logs.map(log => log.userId).filter(Boolean))]
    const targetUserIds = [...new Set(
      logs
        .filter(log => log.action === 'ADMIN_VIEW_AS_USER_START')
        .map(log => log.entityId)
        .filter(Boolean)
    )]

    // 6. Fetch user details
    const [adminUsers, targetUsers] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true
        }
      }),
      prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          username: true,
          avatar: true
        }
      })
    ])

    // 7. Create lookup maps for user details
    const adminMap = new Map(adminUsers.map(user => [user.id, user]))
    const targetUserMap = new Map(targetUsers.map(user => [user.id, user]))

    // 8. Enhance logs with user details
    const enhancedLogs = logs.map(log => {
      const admin = log.userId ? adminMap.get(log.userId) : null
      const targetUser = log.entityId ? targetUserMap.get(log.entityId) : null

      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt.toISOString(),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        admin: admin ? {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          avatar: admin.avatar
        } : null,
        targetUser: targetUser ? {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
          username: targetUser.username,
          avatar: targetUser.avatar
        } : null
      }
    })

    // 9. Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    console.log('[AUDIT-LOG] Found audit logs:', {
      count: logs.length,
      totalCount,
      totalPages
    })

    return NextResponse.json({
      success: true,
      data: {
        logs: enhancedLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('[AUDIT-LOG] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}