import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Helper to get group with counts (no relations exist in schema)
async function getGroupWithCounts(group: any) {
  const [owner, membersCount, postsCount, eventsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: group.ownerId },
      select: { id: true, name: true, avatar: true, email: true }
    }),
    prisma.groupMember.count({ where: { groupId: group.id } }),
    prisma.post.count({ where: { groupId: group.id } }),
    prisma.event.count({ where: { groupId: group.id } })
  ])
  return {
    ...group,
    owner,
    _count: { members: membersCount, posts: postsCount, events: eventsCount }
  }
}

// GET /api/groups/[slug] - Get group detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = await params

    const group = await prisma.group.findFirst({
      where: { slug }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get group with counts manually
    const groupWithCounts = await getGroupWithCounts(group)

    // Get user membership if logged in
    let userMembership = null
    if (session?.user?.id) {
      userMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: group.id,
          userId: session.user.id
        },
        select: {
          id: true,
          role: true,
          userId: true,
          joinedAt: true
        }
      })
    }

    return NextResponse.json({
      group: groupWithCounts,
      userMembership,
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[slug] - Update group (ADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const {
      name,
      description,
      type,
      isPrivate,
      isActive,
      requireApproval,
      showStats,
      bannedWords,
    } = body

    const group = await prisma.group.update({
      where: { slug },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(isActive !== undefined && { isActive }),
        ...(requireApproval !== undefined && { requireApproval }),
        ...(showStats !== undefined && { showStats }),
        ...(bannedWords !== undefined && { bannedWords }),
      },
    })

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[slug] - Delete group (ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    await prisma.group.delete({
      where: { slug },
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
