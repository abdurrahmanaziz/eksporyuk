import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'all'
    const search = searchParams.get('search') || ''
    const groupId = searchParams.get('group') || 'all'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.content = { contains: search, mode: 'insensitive' }
    }
    
    if (groupId && groupId !== 'all') {
      where.groupId = groupId
    }

    if (tab === 'reported') {
      // Skip reported filter - no reports relation in Post model
    } else if (tab === 'pending') {
      where.approvalStatus = 'PENDING'
    } else if (tab === 'pinned') {
      where.isPinned = true
    }

    // Get posts
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get details for each post manually (no relations in schema)
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      const [author, group, likesCount, commentsCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: post.authorId },
          select: { id: true, name: true, avatar: true, role: true }
        }),
        post.groupId ? prisma.group.findUnique({
          where: { id: post.groupId },
          select: { id: true, name: true }
        }) : null,
        prisma.postLike.count({ where: { postId: post.id } }),
        prisma.postComment.count({ where: { postId: post.id } })
      ])
      return { ...post, author, group, likesCount, commentsCount, reports: [] }
    }))

    const formattedPosts = postsWithDetails.map(post => ({
      id: post.id,
      content: post.content,
      type: post.type || 'POST',
      images: post.images || [],
      videos: post.videos || [],
      author: post.author,
      group: post.group,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      viewsCount: 0,
      isPinned: post.isPinned || false,
      isReported: false,
      reportCount: 0,
      approvalStatus: post.approvalStatus || 'APPROVED',
      createdAt: post.createdAt.toISOString(),
    }))

    // Get stats
    const today = startOfDay(new Date())
    const [totalPosts, postsToday, pendingPosts] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.post.count({
        where: { approvalStatus: 'PENDING' },
      }),
    ])

    // Get groups for filter
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      posts: formattedPosts,
      stats: {
        totalPosts,
        postsToday,
        reportedPosts: 0, // No reports relation in schema
        pendingModeration: pendingPosts,
      },
      groups,
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
