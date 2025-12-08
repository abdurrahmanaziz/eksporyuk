import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

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
      where.reports = { some: {} }
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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        reports: true,
      },
    })

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      type: post.type || 'POST',
      images: post.images || [],
      videos: post.videos || [],
      author: post.author,
      group: post.group,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: 0, // Add view tracking if needed
      isPinned: post.isPinned || false,
      isReported: post.reports.length > 0,
      reportCount: post.reports.length,
      approvalStatus: post.approvalStatus || 'APPROVED',
      createdAt: post.createdAt.toISOString(),
    }))

    // Get stats
    const today = startOfDay(new Date())
    const [totalPosts, postsToday, reportedPosts, pendingPosts] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.post.count({
        where: { reports: { some: {} } },
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
        reportedPosts,
        pendingModeration: pendingPosts,
      },
      groups,
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
