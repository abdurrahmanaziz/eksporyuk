import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/chat/mentors
 * 
 * Fetch list of mentors for chat
 * Returns users with MENTOR role + ADMIN users
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

    console.log('[Chat API] Fetching mentors for user:', session.user.id)

    // Fetch users with MENTOR role or ADMIN role (admins can also chat)
    const mentors = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'MENTOR' },
          { role: 'ADMIN' }
        ],
        isActive: true,
        isSuspended: false,
        // Don't include the current user
        NOT: {
          id: session.user.id
        }
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

    console.log('[Chat API] Found mentors:', mentors.length)

    return NextResponse.json(mentors)
  } catch (error) {
    console.error('Error fetching mentors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentors', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
