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

    // Strategy 1: Get users with MENTOR or ADMIN role directly
    const mentorUsers = await prisma.user.findMany({
      where: { 
        role: { in: ['MENTOR', 'ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true
      },
      orderBy: { name: 'asc' }
    })

    // Strategy 2: Also get MentorProfiles for additional info
    const mentorProfiles = await prisma.mentorProfile.findMany()
    const profileMap = new Map(mentorProfiles.map(mp => [mp.userId, mp]))

    // Combine data - use User as primary source
    const mentorsWithDetails = mentorUsers.map(user => {
      const profile = profileMap.get(user.id)
      
      return {
        id: profile?.id || user.id, // Use profile ID if exists, otherwise user ID
        userId: user.id,
        bio: profile?.bio || null,
        expertise: profile?.expertise || null,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        user: user // Keep nested user for compatibility
      }
    })

    console.log('[Admin Mentors] Found', mentorsWithDetails.length, 'mentors')

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