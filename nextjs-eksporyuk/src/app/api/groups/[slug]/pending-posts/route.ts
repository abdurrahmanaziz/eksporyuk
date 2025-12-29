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
      orderBy: { createdAt: 'asc' }
    })

    // Get author info manually for each post (no relations in schema)
    const postsWithAuthors = await Promise.all(posts.map(async (post) => {
      const [author, commentsCount, likesCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: post.authorId },
          select: { id: true, name: true, email: true, avatar: true }
        }),
        prisma.postComment.count({ where: { postId: post.id } }),
        prisma.postLike.count({ where: { postId: post.id } })
      ])
      return { ...post, author, _count: { comments: commentsCount, likes: likesCount } }
    }))

    return NextResponse.json(postsWithAuthors)
  } catch (error) {
    console.error('Get pending posts error:', error)
    return NextResponse.json(
      { error: 'Failed to get pending posts' },
      { status: 500 }
    )
  }
}
