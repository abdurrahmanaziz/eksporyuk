import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        name: true,
        email: true,
        avatar: true,
        phone: true
      }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    // Get stats
    const totalCourses = mentorProfile?.totalCourses || 0
    const totalStudents = mentorProfile?.totalStudents || 0

    return NextResponse.json({
      id: mentorProfile?.id || '',
      bio: mentorProfile?.bio || '',
      expertise: mentorProfile?.expertise ? mentorProfile.expertise.split(',').map(e => e.trim()) : [],
      qualifications: [],
      socialLinks: {},
      paymentInfo: {},
      isVerified: mentorProfile?.verifiedAt ? true : false,
      totalCourses,
      totalStudents,
      rating: Number(mentorProfile?.rating) || 0,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
      }
    })
  } catch (error) {
    console.error('Error fetching mentor profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { bio, expertise } = body

    // Convert expertise array to string
    const expertiseStr = Array.isArray(expertise) ? expertise.join(', ') : expertise

    // Update or create mentor profile
    const mentorProfile = await prisma.mentorProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio,
        expertise: expertiseStr,
      },
      create: {
        userId: session.user.id,
        bio,
        expertise: expertiseStr,
      }
    })

    return NextResponse.json(mentorProfile)
  } catch (error) {
    console.error('Error updating mentor profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
