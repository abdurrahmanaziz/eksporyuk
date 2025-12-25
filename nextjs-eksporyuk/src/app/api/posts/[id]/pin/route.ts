import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/posts/[id]/pin - Toggle pin post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Cek apakah post ada
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Cek permission: post owner, admin, atau moderator grup
    const isAdmin = session.user.role === 'ADMIN'
    const isPostOwner = post.authorId === session.user.id
    const isModerator = post.group?.members.some(
      m => ['ADMIN', 'MODERATOR', 'OWNER'].includes(m.role)
    )

    if (!isAdmin && !isModerator && !isPostOwner) {
      return NextResponse.json(
        { error: 'Only post owner or group admins/moderators can pin posts' },
        { status: 403 }
      )
    }

    // Toggle pin status
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        isPinned: !post.isPinned
      }
    })

    return NextResponse.json({ 
      isPinned: updatedPost.isPinned,
      message: updatedPost.isPinned ? 'Post pinned' : 'Post unpinned'
    })
  } catch (error) {
    console.error('Pin post error:', error)
    return NextResponse.json(
      { error: 'Failed to pin post' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[id]/pin - Support PATCH method
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params })
}
