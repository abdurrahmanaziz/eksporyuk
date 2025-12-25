import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Helper function to get group with counts
async function getGroupWithCounts(group: any) {
  const owner = await prisma.user.findUnique({
    where: { id: group.ownerId },
    select: { id: true, name: true, email: true }
  })

  const membersCount = await prisma.groupMember.count({
    where: { groupId: group.id }
  })

  const postsCount = await prisma.post.count({
    where: { groupId: group.id }
  })

  return {
    ...group,
    owner,
    _count: {
      members: membersCount,
      posts: postsCount,
      courses: 0,
      products: 0
    }
  }
}

// GET /api/admin/groups/[slug] - Get single group details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const group = await prisma.group.findFirst({
      where: { slug }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const groupWithCounts = await getGroupWithCounts(group)

    return NextResponse.json({ group: groupWithCounts })
    
  } catch (error) {
    console.error('Get group error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/groups/[slug] - Update group
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { name, description, type, avatar, coverImage } = body

    // Check if group exists
    const existingGroup = await prisma.group.findFirst({
      where: { slug }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check permission: only owner or admin can edit
    const isOwner = existingGroup.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this group' },
        { status: 403 }
      )
    }

    // Generate new slug if name changed
    let newSlug = existingGroup.slug
    if (name && name !== existingGroup.name) {
      newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check if new slug already exists (excluding current group)
      const slugExists = await prisma.group.findFirst({
        where: {
          slug: newSlug,
          id: { not: existingGroup.id }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Group with this name already exists' },
          { status: 400 }
        )
      }
    }

    const group = await prisma.group.update({
      where: { id: existingGroup.id },
      data: {
        name: name || existingGroup.name,
        description: description || existingGroup.description,
        slug: newSlug,
        type: type || existingGroup.type,
        avatar: avatar !== undefined ? avatar : existingGroup.avatar,
        coverImage: coverImage !== undefined ? coverImage : existingGroup.coverImage
      }
    })

    const groupWithCounts = await getGroupWithCounts(group)

    return NextResponse.json({ group: groupWithCounts })
    
  } catch (error) {
    console.error('Update group error:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/groups/[slug] - Delete group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    // Check if group exists
    const existingGroup = await prisma.group.findFirst({
      where: { slug }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Get counts before deletion
    const membersCount = await prisma.groupMember.count({
      where: { groupId: existingGroup.id }
    })
    const postsCount = await prisma.post.count({
      where: { groupId: existingGroup.id }
    })

    // Check permission: only owner or admin can delete
    const isOwner = existingGroup.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this group' },
        { status: 403 }
      )
    }

    // Delete related data first (no cascade in schema)
    await prisma.groupMember.deleteMany({
      where: { groupId: existingGroup.id }
    })
    await prisma.post.deleteMany({
      where: { groupId: existingGroup.id }
    })

    // Delete group
    await prisma.group.delete({
      where: { id: existingGroup.id }
    })

    return NextResponse.json({ 
      message: 'Group deleted successfully',
      deletedGroup: {
        name: existingGroup.name,
        membersDeleted: membersCount,
        postsDeleted: postsCount
      }
    })
    
  } catch (error) {
    console.error('Delete group error:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
