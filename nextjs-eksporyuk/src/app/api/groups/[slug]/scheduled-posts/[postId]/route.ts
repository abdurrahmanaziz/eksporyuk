import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/scheduled-posts/[postId] - Get single scheduled post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, postId } = await params

    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const scheduledPost = await prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    if (!scheduledPost || scheduledPost.groupId !== group.id) {
      return NextResponse.json({ error: 'Scheduled post not found' }, { status: 404 })
    }

    // Check permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    const canView = scheduledPost.authorId === session.user.id ||
      membership?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role) ||
      session.user.role === 'ADMIN'

    if (!canView) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    return NextResponse.json({ scheduledPost })
  } catch (error) {
    console.error('Get scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled post' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[slug]/scheduled-posts/[postId] - Update scheduled post
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, postId } = await params
    const body = await req.json()

    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const scheduledPost = await prisma.scheduledPost.findUnique({
      where: { id: postId }
    })

    if (!scheduledPost || scheduledPost.groupId !== group.id) {
      return NextResponse.json({ error: 'Scheduled post not found' }, { status: 404 })
    }

    // Only pending posts can be updated
    if (scheduledPost.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending posts can be updated' }, { status: 400 })
    }

    // Check permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    const canEdit = scheduledPost.authorId === session.user.id ||
      membership?.role && ['OWNER', 'ADMIN'].includes(membership.role) ||
      session.user.role === 'ADMIN'

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const {
      content,
      contentFormatted,
      images,
      videos,
      documents,
      scheduledAt,
      timezone
    } = body

    const updateData: any = {}

    if (content !== undefined) updateData.content = content
    if (contentFormatted !== undefined) updateData.contentFormatted = contentFormatted
    if (images !== undefined) updateData.images = images
    if (videos !== undefined) updateData.videos = videos
    if (documents !== undefined) updateData.documents = documents
    if (timezone !== undefined) updateData.timezone = timezone

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      if (scheduledDate <= new Date()) {
        return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
      }
      updateData.scheduledAt = scheduledDate
    }

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ scheduledPost: updatedPost })
  } catch (error) {
    console.error('Update scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[slug]/scheduled-posts/[postId] - Cancel/delete scheduled post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, postId } = await params

    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const scheduledPost = await prisma.scheduledPost.findUnique({
      where: { id: postId }
    })

    if (!scheduledPost || scheduledPost.groupId !== group.id) {
      return NextResponse.json({ error: 'Scheduled post not found' }, { status: 404 })
    }

    // Check permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    const canDelete = scheduledPost.authorId === session.user.id ||
      membership?.role && ['OWNER', 'ADMIN'].includes(membership.role) ||
      session.user.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // If pending, we can cancel it
    if (scheduledPost.status === 'PENDING') {
      await prisma.scheduledPost.update({
        where: { id: postId },
        data: { status: 'CANCELLED' }
      })
      return NextResponse.json({ message: 'Scheduled post cancelled' })
    }

    // Otherwise delete it
    await prisma.scheduledPost.delete({
      where: { id: postId }
    })

    return NextResponse.json({ message: 'Scheduled post deleted' })
  } catch (error) {
    console.error('Delete scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled post' },
      { status: 500 }
    )
  }
}
