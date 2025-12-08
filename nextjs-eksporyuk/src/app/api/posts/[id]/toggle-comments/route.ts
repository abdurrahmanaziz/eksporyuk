import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { commentsEnabled } = body

    // Check if user owns the post
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update comments status
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        commentsEnabled: commentsEnabled,
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error toggling comments:', error)
    return NextResponse.json(
      { error: 'Failed to toggle comments' },
      { status: 500 }
    )
  }
}
