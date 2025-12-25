import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/mentor/materials/courses - Get courses owned by mentor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is mentor or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    // Get courses - if admin, get all; if mentor, get own courses
    let courses
    if (user.role === 'ADMIN') {
      courses = await prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true
        },
        orderBy: { title: 'asc' }
      })
    } else {
      courses = await prisma.course.findMany({
        where: {
          mentorId: mentorProfile?.id
        },
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true
        },
        orderBy: { title: 'asc' }
      })
    }

    return NextResponse.json({ 
      success: true,
      courses 
    })
  } catch (error) {
    console.error('GET /api/mentor/materials/courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
