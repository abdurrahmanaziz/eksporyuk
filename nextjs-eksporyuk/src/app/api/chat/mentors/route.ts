import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/chat/mentors
 * 
 * Fetch list of mentors for chat
 * Returns users with MENTOR role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch users with MENTOR role
    const mentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR',
        isActive: true,
        isSuspended: false
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeenAt: true,
        role: true
      },
      orderBy: [
        { isOnline: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(mentors)
  } catch (error) {
    console.error('Error fetching mentors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentors' },
      { status: 500 }
    )
  }
}
