import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[id]/moderation - Get moderation settings
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner/moderator
    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: session.user.id
      }
    })

    if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      select: {
        bannedWords: true,
        requireApproval: true
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Get moderation settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get moderation settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[id]/moderation - Update moderation settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner/admin
    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: params.id,
        userId: session.user.id
      }
    })

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { bannedWords, requireApproval } = body

    const group = await prisma.group.update({
      where: { id: params.id },
      data: {
        ...(bannedWords !== undefined && { bannedWords }),
        ...(requireApproval !== undefined && { requireApproval })
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Update moderation settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update moderation settings' },
      { status: 500 }
    )
  }
}
