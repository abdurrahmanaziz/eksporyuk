import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[slug]/leaderboard - Get weekly leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'week' // week, month, all-time

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date(0) // All time
    }

    // Find group by slug first
    const group = await prisma.group.findUnique({
      where: { slug: slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get members with their activity stats
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: group.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    // Calculate scores for each member
    const leaderboardData = await Promise.all(
      members.map(async (member) => {
        // Count posts
        const postsCount = await prisma.post.count({
          where: {
            groupId: group.id,
            authorId: member.userId,
            createdAt: {
              gte: startDate
            }
          }
        })

        // Count comments
        const commentsCount = await prisma.postComment.count({
          where: {
            post: {
              groupId: group.id
            },
            userId: member.userId,
            createdAt: {
              gte: startDate
            }
          }
        })

        // Count reactions given
        const reactionsGiven = await prisma.postReaction.count({
          where: {
            post: {
              groupId: group.id
            },
            userId: member.userId,
            createdAt: {
              gte: startDate
            }
          }
        })

        // Count reactions received
        const reactionsReceived = await prisma.postReaction.count({
          where: {
            post: {
              groupId: group.id,
              authorId: member.userId
            },
            createdAt: {
              gte: startDate
            }
          }
        })

        // Calculate score (weighted)
        const score = 
          (postsCount * 5) + 
          (commentsCount * 3) + 
          (reactionsGiven * 1) + 
          (reactionsReceived * 2)

        return {
          user: member.user,
          role: member.role,
          stats: {
            posts: postsCount,
            comments: commentsCount,
            reactionsGiven,
            reactionsReceived,
            score
          }
        }
      })
    )

    // Sort by score descending
    const leaderboard = leaderboardData
      .sort((a, b) => b.stats.score - a.stats.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))

    return NextResponse.json({ 
      leaderboard,
      period 
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
