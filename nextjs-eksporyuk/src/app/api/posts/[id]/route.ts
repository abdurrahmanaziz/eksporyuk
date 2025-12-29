import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-helper'

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
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get all related data manually (no relations in schema)
    const [author, group, likes, comments, likesCount, commentsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: post.authorId },
        select: { id: true, name: true, email: true, avatar: true, role: true, username: true }
      }),
      post.groupId ? prisma.group.findUnique({
        where: { id: post.groupId },
        select: { id: true, name: true }
      }) : null,
      prisma.postLike.findMany({ where: { postId: post.id } }),
      prisma.postComment.findMany({ where: { postId: post.id, parentId: null }, orderBy: { createdAt: 'desc' } }),
      prisma.postLike.count({ where: { postId: post.id } }),
      prisma.postComment.count({ where: { postId: post.id } })
    ])

    // Get users for likes and comments
    const likeUserIds = likes.map((l: any) => l.userId)
    const commentUserIds = comments.map((c: any) => c.userId)
    const allUserIds = [...new Set([...likeUserIds, ...commentUserIds])]
    const users = allUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, name: true, avatar: true }
    }) : []
    const userMap = new Map(users.map(u => [u.id, u]))

    const likesWithUsers = likes.map((l: any) => ({
      userId: l.userId,
      user: userMap.get(l.userId) || null
    }))

    const commentsWithUsers = comments.map((c: any) => ({
      ...c,
      user: userMap.get(c.userId) || null,
      replies: [] // Simplified - no nested replies for now
    }))

    const postWithDetails = {
      ...post,
      author,
      group,
      likes: likesWithUsers,
      comments: commentsWithUsers,
      _count: { comments: commentsCount, likes: likesCount }
    }

    return NextResponse.json({ post: postWithDetails })
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
        images = []
        for (const file of imageFiles) {
          if (file instanceof File && file.size > 0) {
            // Upload to Vercel Blob (production) or local (development)
            const result = await uploadFile(file, {
              folder: 'posts',
              prefix: 'post',
              maxSize: 10 * 1024 * 1024, // 10MB
            })
            images.push(result.url)
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
      }
    })

    // Get author and count manually (no relations in schema)
    const [author, commentsCount, likesCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: post.authorId },
        select: { id: true, name: true, email: true, avatar: true }
      }),
      prisma.postComment.count({ where: { postId: post.id } }),
      prisma.postLike.count({ where: { postId: post.id } })
    ])

    const postWithDetails = {
      ...post,
      author,
      _count: {
        comments: commentsCount,
        likes: likesCount,
      },
    }

    return NextResponse.json({ post: postWithDetails })
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
