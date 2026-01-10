import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/posts - Get timeline posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')
    const userId = searchParams.get('userId') // Filter by specific user

    const whereClause: any = {
      type: { in: ['POST', 'POLL', 'ANNOUNCEMENT'] },
      approvalStatus: 'APPROVED',
      groupId: null, // Only public timeline posts (not group posts)
    }

    // If userId provided, filter by that user
    if (userId) {
      whereClause.authorId = userId
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Get details for each post manually (no relations in schema)
    const transformedPosts = await Promise.all(posts.map(async (post) => {
      const [author, likes, reactions, comments, likesCount, reactionsCount, commentsCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: post.authorId },
          select: { id: true, name: true, email: true, avatar: true, role: true, lastActiveAt: true, province: true, city: true, locationVerified: true }
        }),
        prisma.postLike.findMany({ where: { postId: post.id }, select: { userId: true } }),
        prisma.postReaction.findMany({ where: { postId: post.id } }),
        prisma.postComment.findMany({ where: { postId: post.id }, take: 3, orderBy: { createdAt: 'desc' } }),
        prisma.postLike.count({ where: { postId: post.id } }),
        prisma.postReaction.count({ where: { postId: post.id } }),
        prisma.postComment.count({ where: { postId: post.id } })
      ])

      // Get users for reactions and comments
      const reactionUserIds = reactions.map((r: any) => r.userId)
      const commentUserIds = comments.map((c: any) => c.userId)
      const allUserIds = [...new Set([...reactionUserIds, ...commentUserIds])]
      const users = allUserIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, avatar: true }
      }) : []
      const userMap = new Map(users.map(u => [u.id, u]))

      const reactionsWithUsers = reactions.map((r: any) => ({ ...r, user: userMap.get(r.userId) || null }))
      const commentsWithUsers = comments.map((c: any) => ({ ...c, user: userMap.get(c.userId) || null }))

      return {
        ...post,
        author,
        likes,
        reactions: reactionsWithUsers,
        comments: commentsWithUsers,
        _count: { comments: commentsCount, likes: likesCount, reactions: reactionsCount },
        images: post.images || [],
        videos: post.videos || [],
        documents: post.documents || [],
        taggedUsers: post.taggedUsers || [],
        reactionsCount: post.reactionsCount || {},
        commentsEnabled: post.commentsEnabled !== false,
      }
    }))

    return NextResponse.json({
      posts: transformedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create post in personal timeline
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let content = ''
    let images: string[] = []
    let type = 'POST'

    // Handle FormData (with images)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      content = formData.get('content') as string
      type = (formData.get('type') as string) || 'POST'

      // Handle image uploads
      const imageFiles = formData.getAll('images') as File[]
      
      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          if (file && file.size > 0) {
            // Upload to Vercel Blob (production) or local (development)
            const result = await uploadFile(file, {
              folder: 'posts',
              prefix: 'post',
              maxSize: 10 * 1024 * 1024, // 10MB
            })
            images.push(result.url)
          }
        }
      }
    } else {
      // Handle JSON
      const body = await request.json()
      content = body.content
      images = body.images || []
      type = body.type || 'POST'
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        images: images.length > 0 ? images : null,
        type: type as any,
        authorId: session.user.id,
        groupId: null, // Public timeline post (not in group)
        approvalStatus: 'APPROVED', // Personal posts don't need approval
      },
    })

    // Get author info manually (no relations in schema)
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, avatar: true, role: true }
    })

    const postWithDetails = {
      ...post,
      author,
      _count: { comments: 0, likes: 0, reactions: 0 }
    }

    return NextResponse.json({ post: postWithDetails }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
