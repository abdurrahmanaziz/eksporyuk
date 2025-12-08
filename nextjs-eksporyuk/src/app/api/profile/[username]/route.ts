import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch public profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        province: true,
        city: true,
        district: true,
        locationVerified: true,
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
        isFounder: true,
        isCoFounder: true,
        // Counts
        _count: {
          select: {
            posts: true,
            groupMemberships: true,
          }
        },
        // Recent posts (limit 5)
        posts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: {
            approvalStatus: 'APPROVED',
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            type: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              }
            },
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
              }
            }
          }
        },
        // Groups (limit 10)
        groupMemberships: {
          take: 10,
          where: {
            group: {
              isActive: true,
            }
          },
          select: {
            role: true,
            joinedAt: true,
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
                type: true,
                _count: {
                  select: {
                    members: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is active
    if (!user.isOnline && user.lastSeenAt) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (user.lastSeenAt < fiveMinutesAgo) {
        // User is offline
      }
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
