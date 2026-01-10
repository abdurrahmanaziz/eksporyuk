import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/groups/[id]/ban - Ban user from group
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, reason, duration } = await req.json() // duration in days, null = permanent

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'User ID and reason are required' },
        { status: 400 }
      )
    }

    // Check if current user is admin/moderator of group
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
        { error: 'Only admins/moderators can ban users' },
        { status: 403 }
      )
    }

    // Calculate expiration
    let expiresAt = null
    if (duration) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + duration)
    }

    // Create ban
    const ban = await prisma.bannedUser.create({
      data: {
        userId,
        groupId: params.id,
        reason,
        bannedById: session.user.id,
        expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Remove from group
    await prisma.groupMember.deleteMany({
      where: {
        groupId: params.id,
        userId
      }
    })

    // Notify banned user
    await prisma.notification.create({
      data: {
        userId,
        type: 'BAN',
        title: 'Banned from Group',
        message: `You have been banned from a group. Reason: ${reason}`,
        link: `/community/groups`
      }
    })

    return NextResponse.json({ 
      ban,
      message: 'User banned successfully' 
    })
  } catch (error) {
    console.error('Ban user error:', error)
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/ban - Unban user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check permissions
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
        { error: 'Only admins/moderators can unban users' },
        { status: 403 }
      )
    }

    // Remove ban
    await prisma.bannedUser.deleteMany({
      where: {
        userId,
        groupId: params.id
      }
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        type: 'UNBAN',
        title: 'Unbanned from Group',
        message: 'You have been unbanned from a group',
        link: `/community/groups/${params.id}`
      }
    })

    return NextResponse.json({ message: 'User unbanned successfully' })
  } catch (error) {
    console.error('Unban user error:', error)
    return NextResponse.json(
      { error: 'Failed to unban user' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[id]/ban - Get banned users list
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
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
        { error: 'Only admins/moderators can view banned users' },
        { status: 403 }
      )
    }

    const bannedUsers = await prisma.bannedUser.findMany({
      where: {
        groupId: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        bannedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ bannedUsers })
  } catch (error) {
    console.error('Get banned users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banned users' },
      { status: 500 }
    )
  }
}
