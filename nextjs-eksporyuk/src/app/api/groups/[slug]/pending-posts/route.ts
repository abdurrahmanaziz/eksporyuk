import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[id]/pending-posts - Get pending posts for approval
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner/moderator
    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: session.user.id
      }
    })

    if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const posts = await prisma.post.findMany({
      where: {
        groupId: params.id,
        approvalStatus: 'PENDING'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Get pending posts error:', error)
    return NextResponse.json(
      { error: 'Failed to get pending posts' },
      { status: 500 }
    )
  }
}
