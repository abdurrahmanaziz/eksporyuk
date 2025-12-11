import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/suggested - Get suggested groups for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get groups user is not already a member of
    const userGroupIds = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    }).then(members => members.map(m => m.groupId))

    // Get user's current memberships to suggest relevant premium groups
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        membership: {
          include: {
            membershipGroups: {
              select: { groupId: true }
            }
          }
        }
      }
    })

    const accessibleGroupIds = userMemberships.flatMap(
      um => um.membership.membershipGroups.map(mg => mg.groupId)
    )

    // Find suggested groups
    const suggestedGroups = await prisma.group.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { notIn: userGroupIds } }, // Not already a member
          {
            OR: [
              { type: 'PUBLIC' }, // Public groups
              { id: { in: accessibleGroupIds } }, // Groups accessible via membership
              // Groups with similar interests (simplified)
              {
                membershipGroups: {
                  some: {
                    membership: {
                      userMemberships: {
                        some: {
                          userId: session.user.id,
                          isActive: true
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        members: {
          take: 3,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: [
        { members: { _count: 'desc' } }, // Most popular first
        { createdAt: 'desc' }
      ],
      take: 10
    })

    return NextResponse.json(suggestedGroups)

  } catch (error) {
    console.error('Error fetching suggested groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggested groups' },
      { status: 500 }
    )
  }
}