import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/posts/[id]/like - Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      )
    }

    // Create like and increment count
    await prisma.$transaction([
      prisma.postLike.create({
        data: {
          postId: id,
          userId: session.user.id,
        },
      }),
      prisma.post.update({
        where: { id },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ message: 'Post liked' }, { status: 201 })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id]/like - Unlike a post
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

    // Check if like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    })

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Not liked yet' },
        { status: 400 }
      )
    }

    // Delete like and decrement count
    await prisma.$transaction([
      prisma.postLike.delete({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id,
          },
        },
      }),
      prisma.post.update({
        where: { id },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ message: 'Post unliked' })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Failed to unlike post' },
      { status: 500 }
    )
  }
}
