import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/groups/[slug]/members - Get group members
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
    // Get group
    const group = await prisma.group.findFirst({
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

    // Get members - no relation to user in schema
    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'desc' }
      ]
    })

    // Get user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await prisma.user.findUnique({
          where: { id: member.userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        })
        return {
          ...member,
          user: user || { id: member.userId, name: 'Unknown', email: '', avatar: null }
        }
      })
    )

    return NextResponse.json({ members: membersWithUsers })
  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}
