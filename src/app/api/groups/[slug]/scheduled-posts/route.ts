import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/scheduled-posts - Get user's scheduled posts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // PENDING, PUBLISHED, CANCELLED, FAILED

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true, allowScheduling: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    if (!membership && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    // Get scheduled posts
    let where: any = {
      groupId: group.id
    }

    // Only admin/moderators can see all scheduled posts
    const isAdminOrMod = membership?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)
    if (!isAdminOrMod && session.user.role !== 'ADMIN') {
      where.authorId = session.user.id
    }

    if (status) {
      where.status = status
    }

    const scheduledPosts = await prisma.scheduledPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })

    return NextResponse.json({ scheduledPosts })
  } catch (error) {
    console.error('Get scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[slug]/scheduled-posts - Create scheduled post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await req.json()

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true, allowScheduling: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.allowScheduling) {
      return NextResponse.json({ error: 'Scheduling is not enabled for this group' }, { status: 400 })
    }

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    if (!membership && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    const {
      content,
      contentFormatted,
      images,
      videos,
      documents,
      type = 'POST',
      scheduledAt,
      timezone = 'Asia/Jakarta'
    } = body

    if (!content || !scheduledAt) {
      return NextResponse.json({ error: 'Content and scheduledAt are required' }, { status: 400 })
    }

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
    }

    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        authorId: session.user.id,
        groupId: group.id,
        content,
        contentFormatted,
        images,
        videos,
        documents,
        type,
        scheduledAt: scheduledDate,
        timezone,
        status: 'PENDING'
      },
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

    return NextResponse.json({ scheduledPost }, { status: 201 })
  } catch (error) {
    console.error('Create scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled post' },
      { status: 500 }
    )
  }
}
