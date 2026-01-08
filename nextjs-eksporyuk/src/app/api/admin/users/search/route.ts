import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/users/search
 * 
 * Search users untuk keperluan admin view-as-user
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

    // 2. Get search query
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 3) {
      return NextResponse.json({
        users: [],
        message: 'Search query must be at least 3 characters'
      })
    }

    console.log('[USER-SEARCH] Admin search:', { 
      adminId: session.user.id, 
      query: query.substring(0, 20) + '...'
    })

    // 3. Search users by email, name, atau username
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            username: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            memberCode: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        isActive: true,
        isSuspended: true,
        suspendReason: true,
        memberCode: true,
        createdAt: true,
        lastActiveAt: true,
        profileCompleted: true
      },
      orderBy: [
        { isActive: 'desc' }, // Active users first
        { name: 'asc' },
        { email: 'asc' }
      ],
      take: 20 // Limit results untuk performance
    })

    console.log('[USER-SEARCH] Found users:', users.length)

    // 4. Format hasil untuk frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      isSuspended: user.isSuspended,
      suspendReason: user.suspendReason,
      memberCode: user.memberCode,
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString(),
      profileCompleted: user.profileCompleted
    }))

    // 5. Log activity untuk audit trail
    try {
      await prisma.activityLog.create({
        data: {
          id: `admin_user_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'ADMIN_USER_SEARCH',
          entity: 'USER',
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            searchQuery: query,
            resultsCount: users.length,
            adminId: session.user.id,
            adminEmail: session.user.email,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.error('[USER-SEARCH] Failed to log search activity:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    })

  } catch (error) {
    console.error('[USER-SEARCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}