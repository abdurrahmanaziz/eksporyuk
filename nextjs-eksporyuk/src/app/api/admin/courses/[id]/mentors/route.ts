import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/admin/courses/[id]/mentors - Get mentors for a course
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const courseId = params.id

    // Get course mentors with user details
    const courseMentors = await prisma.courseMentor.findMany({
      where: { 
        courseId,
        isActive: true 
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get mentor profiles
    const mentorIds = courseMentors.map(cm => cm.mentorId)
    const mentorProfiles = await prisma.mentorProfile.findMany({
      where: { id: { in: mentorIds } }
    })

    // Get user data for all mentor profiles
    const userIds = mentorProfiles.map(mp => mp.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    const userMap = new Map(users.map(u => [u.id, u]))
    const mentorMap = new Map(mentorProfiles.map(mp => [mp.id, mp]))

    const mentorsWithDetails = courseMentors.map(cm => {
      const mentorProfile = mentorMap.get(cm.mentorId)
      const user = mentorProfile ? userMap.get(mentorProfile.userId) : null
      
      return {
        id: cm.mentorId, // Use mentorId for removal
        courseMentorId: cm.id,
        mentorId: cm.mentorId,
        role: cm.role,
        isActive: cm.isActive,
        createdAt: cm.createdAt,
        name: user?.name || 'Unknown Mentor',
        email: user?.email || '',
        avatar: user?.avatar || null,
        mentor: mentorProfile ? {
          ...mentorProfile,
          user: user
        } : null
      }
    })

    return NextResponse.json({ 
      success: true, 
      mentors: mentorsWithDetails 
    })

  } catch (error) {
    console.error('GET /api/admin/courses/[id]/mentors error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course mentors' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[id]/mentors - Add mentor to course
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can add mentors to courses' }, { status: 403 })
    }

    const courseId = params.id
    const body = await request.json()
    const { mentorId, role = 'MENTOR' } = body

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 })
    }

    // Try to find mentor profile by ID first
    let mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorId }
    })

    // If not found, check if mentorId is a User ID and auto-create MentorProfile
    if (!mentorProfile) {
      // Check if mentorId is a User ID
      const mentorUser = await prisma.user.findUnique({
        where: { id: mentorId },
        select: { id: true, role: true, name: true }
      })

      if (!mentorUser) {
        return NextResponse.json({ error: 'Mentor tidak ditemukan' }, { status: 404 })
      }

      // Verify user is MENTOR or ADMIN
      if (!['MENTOR', 'ADMIN'].includes(mentorUser.role)) {
        return NextResponse.json({ error: 'User bukan mentor' }, { status: 400 })
      }

      // Check if MentorProfile exists by userId
      mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: mentorId }
      })

      // If still not found, auto-create MentorProfile
      if (!mentorProfile) {
        const now = new Date()
        mentorProfile = await prisma.mentorProfile.create({
          data: {
            id: `mentor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: mentorId,
            bio: null,
            expertise: null,
            isActive: true,
            createdAt: now,
            updatedAt: now
          }
        })
        console.log('[CourseMentors] Auto-created MentorProfile for user:', mentorId)
      }
    }

    // Check if mentor already assigned to this course
    const existingAssignment = await prisma.courseMentor.findFirst({
      where: {
        courseId,
        mentorId: mentorProfile.id,
        isActive: true
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ error: 'Mentor sudah ditambahkan ke kursus ini' }, { status: 409 })
    }

    // Create mentor assignment
    const now = new Date()
    const courseMentor = await prisma.courseMentor.create({
      data: {
        id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId,
        mentorId: mentorProfile.id,
        role: role,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    })

    return NextResponse.json({
      success: true,
      courseMentor
    })

  } catch (error) {
    console.error('POST /api/admin/courses/[id]/mentors error:', error)
    return NextResponse.json(
      { error: 'Failed to add mentor to course' },
      { status: 500 }
    )
  }
}