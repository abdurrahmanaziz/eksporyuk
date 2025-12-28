import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Generate ID
function generateId(): string {
  return 'c' + randomBytes(12).toString('hex').slice(0, 24)
}

// POST /api/groups/[slug]/join - Join a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug: groupSlug } = await params

    // Find group by ID or slug
    const group = await prisma.group.findFirst({
      where: {
        OR: [
          { id: groupSlug },
          { slug: groupSlug }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        requireApproval: true,
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: session.user.id,
      }
    })

    if (existingMember) {
      return NextResponse.json({ 
        error: 'Anda sudah menjadi member grup ini',
        member: existingMember 
      }, { status: 400 })
    }

    // For PRIVATE groups, check if user has membership access
    if (group.type === 'PRIVATE') {
      // Get user's active memberships
      const userMemberships = await prisma.userMembership.findMany({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
        },
        select: { membershipId: true }
      })

      if (userMemberships.length > 0) {
        // Check if any membership grants access to this group
        const hasAccess = await prisma.membershipGroup.findFirst({
          where: {
            membershipId: { in: userMemberships.map(m => m.membershipId) },
            groupId: group.id
          }
        })

        if (!hasAccess) {
          return NextResponse.json({ 
            error: 'Anda perlu membeli membership yang sesuai untuk bergabung ke grup ini' 
          }, { status: 403 })
        }
      } else {
        return NextResponse.json({ 
          error: 'Anda perlu membeli membership untuk bergabung ke grup private ini' 
        }, { status: 403 })
      }
    }

    // Create member
    const member = await prisma.groupMember.create({
      data: {
        id: generateId(),
        groupId: group.id,
        userId: session.user.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Berhasil bergabung ke grup!',
      member,
      group: {
        id: group.id,
        name: group.name,
        slug: group.slug,
      }
    })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Gagal bergabung ke grup' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/join - Leave a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Find group by ID or slug
    const group = await prisma.group.findFirst({
      where: {
        OR: [
          { id: groupId },
          { slug: groupId }
        ]
      },
      select: { id: true, ownerId: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 })
    }

    // Can't leave if you're the owner
    if (group.ownerId === session.user.id) {
      return NextResponse.json({ 
        error: 'Owner tidak bisa keluar dari grup. Transfer kepemilikan terlebih dahulu.' 
      }, { status: 400 })
    }

    // Find and delete membership
    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: session.user.id,
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Anda bukan member grup ini' }, { status: 400 })
    }

    await prisma.groupMember.delete({
      where: { id: member.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari grup'
    })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json(
      { error: 'Gagal keluar dari grup' },
      { status: 500 }
    )
  }
}
