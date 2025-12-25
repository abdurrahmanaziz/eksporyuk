import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { pusherService } from '@/lib/pusher'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/posts/[id]/save - Toggle save/bookmark a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user already saved this post
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    let isSaved: boolean

    if (existingSave) {
      // Unsave the post
      await prisma.savedPost.delete({
        where: { id: existingSave.id },
      })
      isSaved = false
    } else {
      // Save the post
      await prisma.savedPost.create({
        data: {
          userId: session.user.id,
          postId,
        },
      })
      isSaved = true
    }

    // Trigger Pusher event for real-time notification
    try {
      await pusherService.notifyUser(session.user.id, 'post-save-status', {
        postId,
        isSaved,
        message: isSaved ? 'Postingan berhasil disimpan!' : 'Postingan dihapus dari simpanan',
        timestamp: new Date().toISOString()
      })
    } catch (pusherError) {
      console.error('Pusher notification failed:', pusherError)
      // Don't fail the request if pusher fails
    }

    return NextResponse.json({ isSaved })
  } catch (error: any) {
    console.error('[SAVE POST API] Error toggling save:', error)
    console.error('[SAVE POST API] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    return NextResponse.json(
      { error: error.message || 'Failed to toggle save' },
      { status: 500 }
    )
  }
}

// GET /api/posts/[id]/save - Check if post is saved by current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ isSaved: false })
    }

    const { id: postId } = await params

    const savedPost = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ isSaved: !!savedPost })
  } catch (error) {
    console.error('Error checking save status:', error)
    return NextResponse.json({ isSaved: false })
  }
}