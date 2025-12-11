import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/groups/[id]/announcements - Create announcement
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/moderator
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: params.id,
          userId: session.user.id
        }
      }
    })

    const isAdmin = session.user.role === 'ADMIN'
    const isModerator = member && ['ADMIN', 'MODERATOR', 'OWNER'].includes(member.role)

    if (!isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'Only admins/moderators can create announcements' },
        { status: 403 }
      )
    }

    const { content } = await req.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Create announcement post
    const announcement = await prisma.post.create({
      data: {
        groupId: params.id,
        authorId: session.user.id,
        type: 'ANNOUNCEMENT',
        content,
        isPinned: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Notify all members
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: params.id,
        userId: { not: session.user.id }
      },
      select: { userId: true }
    })

    await Promise.all(
      members.slice(0, 100).map(m =>
        prisma.notification.create({
          data: {
            userId: m.userId,
            type: 'ANNOUNCEMENT',
            title: 'Pengumuman Baru',
            message: content.substring(0, 100),
            link: `/community/groups/${params.id}`
          }
        })
      )
    )

    return NextResponse.json({ 
      announcement,
      message: 'Announcement created successfully' 
    })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[id]/announcements - Get announcements
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcements = await prisma.post.findMany({
      where: {
        groupId: params.id,
        type: 'ANNOUNCEMENT',
        isPinned: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}
