import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// POST /api/posts/[id]/approve - Approve pending post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get post to check group
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: { group: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user is admin/owner/moderator
    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: post.groupId,
        userId: session.user.id
      }
    })

    if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action } = await req.json()

    if (action === 'approve') {
      // Approve post
      const updatedPost = await prisma.post.update({
        where: { id: params.id },
        data: { approvalStatus: 'APPROVED' }
      })

      // Send notification to author
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'POST_APPROVED',
          content: `Postingan Anda di grup "${post.group.name}" telah disetujui`,
          relatedId: post.id
        }
      })

      return NextResponse.json(updatedPost)
    } else if (action === 'reject') {
      // Reject post
      const updatedPost = await prisma.post.update({
        where: { id: params.id },
        data: { approvalStatus: 'REJECTED' }
      })

      // Send notification to author
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'POST_REJECTED',
          content: `Postingan Anda di grup "${post.group.name}" ditolak`,
          relatedId: post.id
        }
      })

      return NextResponse.json(updatedPost)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Approve post error:', error)
    return NextResponse.json(
      { error: 'Failed to process post approval' },
      { status: 500 }
    )
  }
}
