import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
    const group = await prisma.group.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            members: true,
            posts: true,
            courses: true,
            products: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ group })
    
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
    const existingGroup = await prisma.group.findUnique({
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
      where: { slug },
      data: {
        name: name || existingGroup.name,
        description: description || existingGroup.description,
        slug: newSlug,
        type: type || existingGroup.type,
        avatar: avatar !== undefined ? avatar : existingGroup.avatar,
        coverImage: coverImage !== undefined ? coverImage : existingGroup.coverImage
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    })

    return NextResponse.json({ group })
    
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
    const existingGroup = await prisma.group.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check permission: only owner or admin can delete
    const isOwner = existingGroup.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this group' },
        { status: 403 }
      )
    }

    // Delete group (cascade will handle members, posts, etc.)
    await prisma.group.delete({
      where: { slug }
    })

    return NextResponse.json({ 
      message: 'Group deleted successfully',
      deletedGroup: {
        name: existingGroup.name,
        membersDeleted: existingGroup._count.members,
        postsDeleted: existingGroup._count.posts
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
