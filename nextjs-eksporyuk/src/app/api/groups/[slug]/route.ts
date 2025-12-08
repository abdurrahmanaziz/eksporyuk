import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[slug] - Get group detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = await params

    const group = await prisma.group.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        members: {
          where: session?.user?.id ? {
            userId: session.user.id
          } : undefined,
          select: {
            id: true,
            role: true,
            userId: true,
            joinedAt: true,
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'desc' },
          ],
        },
        _count: {
          select: {
            members: true,
            posts: true,
            events: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is a member
    const userMembership = session?.user?.id
      ? group.members.find((m) => m.userId === session.user.id)
      : null

    return NextResponse.json({
      group,
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
