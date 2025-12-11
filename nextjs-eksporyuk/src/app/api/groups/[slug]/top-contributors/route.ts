import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/top-contributors
// Fetches top contributors in a group based on posts and comments this week
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const period = searchParams.get('period') || 'week' // week, month, all

    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grup tidak ditemukan' },
        { status: 404 }
      )
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0) // All time
    }

    // Get group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: group.id },
      select: { 
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    const memberIds = groupMembers.map(m => m.userId)

    // Get posts count per user in this group
    const postsCount = await prisma.post.groupBy({
      by: ['authorId'],
      where: {
        groupId: group.id,
        authorId: { in: memberIds },
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    })

    // Get comments count per user in this group's posts
    const commentsCount = await prisma.postComment.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        post: {
          groupId: group.id
        },
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    })

    // Get reactions received per user (on their posts in this group)
    const reactionsReceived = await prisma.postReaction.groupBy({
      by: ['postId'],
      where: {
        post: {
          groupId: group.id,
          authorId: { in: memberIds }
        },
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    })

    // Get post authors to map reactions
    const postsWithReactions = reactionsReceived.length > 0 
      ? await prisma.post.findMany({
          where: {
            id: { in: reactionsReceived.map(r => r.postId) }
          },
          select: {
            id: true,
            authorId: true
          }
        })
      : []

    // Calculate reactions per user
    const reactionsPerUser: Record<string, number> = {}
    postsWithReactions.forEach(post => {
      const reactionCount = reactionsReceived.find(r => r.postId === post.id)?._count?.id || 0
      reactionsPerUser[post.authorId] = (reactionsPerUser[post.authorId] || 0) + reactionCount
    })

    // Build score map: Posts × 3 + Comments × 2 + Reactions × 1
    const scoreMap: Record<string, { posts: number; comments: number; reactions: number; score: number }> = {}

    memberIds.forEach(userId => {
      scoreMap[userId] = { posts: 0, comments: 0, reactions: 0, score: 0 }
    })

    postsCount.forEach(p => {
      if (scoreMap[p.authorId]) {
        scoreMap[p.authorId].posts = p._count.id
      }
    })

    commentsCount.forEach(c => {
      if (scoreMap[c.userId]) {
        scoreMap[c.userId].comments = c._count.id
      }
    })

    Object.entries(reactionsPerUser).forEach(([userId, count]) => {
      if (scoreMap[userId]) {
        scoreMap[userId].reactions = count
      }
    })

    // Calculate final scores
    Object.keys(scoreMap).forEach(userId => {
      const data = scoreMap[userId]
      data.score = (data.posts * 3) + (data.comments * 2) + (data.reactions * 1)
    })

    // Sort by score and get top contributors
    const sortedMembers = groupMembers
      .map(member => ({
        ...member.user,
        posts: scoreMap[member.userId]?.posts || 0,
        comments: scoreMap[member.userId]?.comments || 0,
        reactions: scoreMap[member.userId]?.reactions || 0,
        score: scoreMap[member.userId]?.score || 0
      }))
      .filter(m => m.score > 0) // Only show users with activity
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Add rank
    const rankedContributors = sortedMembers.map((member, index) => ({
      ...member,
      rank: index + 1
    }))

    return NextResponse.json({
      success: true,
      contributors: rankedContributors,
      period,
      periodLabel: period === 'week' ? 'Minggu Ini' : period === 'month' ? 'Bulan Ini' : 'Semua Waktu'
    })
  } catch (error: any) {
    console.error('[GET_TOP_CONTRIBUTORS_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat top kontributor' },
      { status: 500 }
    )
  }
}
