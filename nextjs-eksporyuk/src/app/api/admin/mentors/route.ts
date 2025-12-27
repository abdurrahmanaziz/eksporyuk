import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/admin/mentors - Get all available mentors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all mentor profiles with user details
    const mentorProfiles = await prisma.mentorProfile.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const userIds = mentorProfiles.map(mp => mp.userId)
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        role: { in: ['MENTOR', 'ADMIN'] } // Only users with mentor or admin role
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true
      }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const mentorsWithDetails = mentorProfiles
      .map(mp => {
        const user = userMap.get(mp.userId)
        if (!user) return null
        
        return {
          id: mp.id,
          userId: mp.userId,
          bio: mp.bio,
          expertise: mp.expertise,
          user: user
        }
      })
      .filter(Boolean) // Remove null entries

    return NextResponse.json({ 
      success: true, 
      mentors: mentorsWithDetails 
    })

  } catch (error) {
    console.error('GET /api/admin/mentors error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentors' },
      { status: 500 }
    )
  }
}