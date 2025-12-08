import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            lastActiveAt: true,
            province: true,
            city: true,
            locationVerified: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          take: 3,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Transform posts to ensure all required fields are present
    const transformedPosts = posts.map(post => ({
      ...post,
      images: post.images || [],
      videos: post.videos || [],
      documents: post.documents || [],
      taggedUsers: post.taggedUsers || [],
      reactionsCount: post.reactionsCount || {},
      reactions: post.reactions || [],
      commentsEnabled: post.commentsEnabled !== false,
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
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'posts')
        
        // Create upload directory if it doesn't exist
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }

        for (const file of imageFiles) {
          if (file && file.size > 0) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Generate unique filename
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
            const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filepath = join(uploadDir, filename)

            await writeFile(filepath, buffer)
            images.push(`/uploads/posts/${filename}`)
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
        type,
        authorId: session.user.id,
        groupId: null, // Public timeline post (not in group)
        approvalStatus: 'APPROVED', // Personal posts don't need approval
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
          },
        },
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
