import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/community/online-users - Get currently active users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get users active in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

    const activeUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } }, // Exclude current user
          { lastActiveAt: { gte: fifteenMinutesAgo } },
          { 
            OR: [
              // Users from same groups
              {
                groupMembers: {
                  some: {
                    group: {
                      members: {
                        some: { userId: session.user.id }
                      }
                    }
                  }
                }
              },
              // Users with similar memberships
              {
                userMemberships: {
                  some: {
                    membership: {
                      userMemberships: {
                        some: { userId: session.user.id }
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lastActiveAt: true,
        role: true
      },
      orderBy: {
        lastActiveAt: 'desc'
      },
      take: limit
    })

    // Update current user's last active time
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() }
    })

    return NextResponse.json(activeUsers)

  } catch (error) {
    console.error('Error fetching online users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    )
  }
}