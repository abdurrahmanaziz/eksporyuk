import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/posts/[id] - Get post detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          where: {
            parentId: null, // Top-level comments only
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Check if user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if request is FormData (with images) or JSON
    const contentType = request.headers.get('content-type')
    let content: string | undefined
    let images: string[] | undefined

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData with image uploads
      const formData = await request.formData()
      const contentField = formData.get('content')
      content = contentField ? String(contentField) : undefined

      // Handle image uploads
      const imageFiles = formData.getAll('images')
      if (imageFiles.length > 0) {
        const fs = require('fs')
        const path = require('path')
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts')
        
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        images = []
        for (const file of imageFiles) {
          if (file instanceof File) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
            const filepath = path.join(uploadDir, filename)
            
            fs.writeFileSync(filepath, buffer)
            images.push(`/uploads/posts/${filename}`)
          }
        }
      } else {
        // Check if images are sent as JSON string (existing images)
        const imagesField = formData.get('images')
        if (imagesField) {
          try {
            images = JSON.parse(String(imagesField))
          } catch {
            images = undefined
          }
        }
      }
    } else {
      // Handle JSON request
      const body = await request.json()
      content = body.content
      images = body.images
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(images !== undefined && { images }),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is the author or admin
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
