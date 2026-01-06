import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/groups/[groupId]/members
 * Get all members dari sebuah group untuk @all/@member tags
 * Security: User harus member dari group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = await params

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    // Verify user is member of group
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: session.user.id
      }
    })

    if (!groupMember) {
      return NextResponse.json({ error: 'Unauthorized - not a group member' }, { status: 403 })
    }

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      members: members.map(m => m.user),
      count: members.length
    })
  } catch (error) {
    console.error('[GROUP_MEMBERS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    )
  }
}
