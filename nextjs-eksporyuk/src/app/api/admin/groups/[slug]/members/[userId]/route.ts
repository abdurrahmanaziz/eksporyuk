import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH /api/admin/groups/[slug]/members/[userId] - Update member role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, userId } = await params
    const { role } = await request.json()

    if (!role || !['MEMBER', 'MODERATOR', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get group
    const group = await prisma.group.findUnique({
      where: { slug }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check permission
    const isOwner = group.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update member role
    const member = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId
        }
      },
      data: { role }
    })

    return NextResponse.json({ message: 'Role updated', member })
  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/groups/[slug]/members/[userId] - Remove member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, userId } = await params
    // Get group
    const group = await prisma.group.findUnique({
      where: { slug }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check permission
    const isOwner = group.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot remove owner
    if (userId === group.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove group owner' },
        { status: 400 }
      )
    }

    // Delete member
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId
        }
      }
    })

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
