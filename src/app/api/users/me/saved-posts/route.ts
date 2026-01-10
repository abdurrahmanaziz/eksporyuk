import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/users/me/saved-posts - Get user's saved posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const savedPosts = await prisma.savedPost.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        Post: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: {
                PostReaction: true,
                PostComment: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform data to match frontend expected structure
    const transformedPosts = savedPosts.map(item => ({
      ...item,
      post: item.Post ? {
        ...item.Post,
        author: item.Post.User,
        _count: {
          likes: item.Post._count?.PostReaction || 0,
          comments: item.Post._count?.PostComment || 0
        }
      } : null
    }))

    const total = await prisma.savedPost.count({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      savedPosts: transformedPosts,
      total,
      hasMore: offset + savedPosts.length < total
    })
  } catch (error: any) {
    console.error('[API] Get saved posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved posts', message: error.message },
      { status: 500 }
    )
  }
}
