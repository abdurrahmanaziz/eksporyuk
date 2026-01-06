import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/search?q=username&limit=10&groupId=xxx&excludeId=xxx
 * Search untuk user mentions dengan optional group filter
 * Enhanced untuk support @mention di comments dengan autocomplete
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const groupId = searchParams.get('groupId')
    const excludeId = searchParams.get('excludeId') || session.user.id

    // Validate query
    if (query.length < 1) {
      return NextResponse.json({ users: [] })
    }

    if (query.length > 50) {
      return NextResponse.json({ error: 'Search query terlalu panjang' }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = {
      AND: [
        {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        { id: { not: excludeId } }
      ]
    }

    // If groupId specified, only return group members
    if (groupId) {
      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true }
      })

      const memberIds = groupMembers.map(m => m.userId)
      
      if (memberIds.length === 0) {
        return NextResponse.json({ users: [] })
      }

      whereClause.id = { in: memberIds, not: excludeId }
    }

    // Search users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        role: true
      },
      take: limit,
      orderBy: [
        { name: 'asc' },
        { username: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    })

  } catch (error: any) {
    console.error('User search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search users',
      users: []
    }, { status: 500 })
  }
}
