import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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

    // Get mentor profiles and user data separately
    const mentorIds = courseMentors.map(cm => cm.mentorId)
    const mentorProfiles = await prisma.mentorProfile.findMany({
      where: { id: { in: mentorIds } }
    })

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
        id: cm.id,
        mentorId: cm.mentorId,
        role: cm.role,
        isActive: cm.isActive,
        createdAt: cm.createdAt,
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

    // Verify mentor profile exists
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorId }
    })

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 })
    }

    // Check if mentor already assigned to this course
    const existingAssignment = await prisma.courseMentor.findFirst({
      where: {
        courseId,
        mentorId,
        isActive: true
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ error: 'Mentor already assigned to this course' }, { status: 409 })
    }

    // Create mentor assignment
    const courseMentor = await prisma.courseMentor.create({
      data: {
        id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId,
        mentorId,
        role: role,
        isActive: true
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