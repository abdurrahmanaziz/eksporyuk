import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/mentor/courses - Get mentor's courses
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

    // Get mentor profile for filtering
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    // Filter: Admin sees all, Mentor sees only their courses
    const whereClause = user.role === 'ADMIN' ? {} : { mentorId: mentorProfile?.id }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        checkoutSlug: true,
        description: true,
        thumbnail: true,
        price: true,
        originalPrice: true,
        status: true,
        monetizationType: true,
        isPublished: true,
        enrollmentCount: true,
        rating: true,
        createdAt: true,
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        modules: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            modules: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true,
      courses 
    })
  } catch (error) {
    console.error('GET /api/mentor/courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/mentor/courses - Create new course (by mentor)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      title,
      description,
      thumbnail,
      price,
      originalPrice,
      duration,
      level,
      monetizationType,
      mentorId, // Admin can assign mentor
      groupId,
      mailketingListId,
      mailketingListName
    } = body

    console.log('POST /api/admin/courses - Received body:', body)

    // Validate required fields
    if (!title || !description || price === undefined || price === null) {
      console.error('Validation failed:', { title, description, price })
      return NextResponse.json(
        { error: 'Title, description, and price are required' },
        { status: 400 }
      )
    }

    // Get default mentor commission from CourseSettings
    let settings = await prisma.courseSettings.findFirst()
    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.courseSettings.create({
        data: {
          defaultMentorCommission: 50,
          defaultAffiliateCommission: 10,
        },
      })
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this title already exists' },
        { status: 400 }
      )
    }

    // Get or create mentor profile for current user
    let mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!mentorProfile) {
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          userId: session.user.id,
          bio: '',
          expertise: '',
          isActive: true
        }
      })
    }

    const finalMentorId = mentorId || mentorProfile.id

    console.log('Using mentor ID:', finalMentorId)

    // Create course
    const course = await prisma.course.create({
      data: {
        mentorId: finalMentorId,
        title,
        slug,
        description,
        thumbnail,
        price,
        originalPrice: originalPrice || price,
        duration,
        level: level || 'BEGINNER',
        monetizationType: monetizationType || 'FREE',
        status: user.role === 'ADMIN' ? 'APPROVED' : 'DRAFT', // Admin auto-approved, Mentor starts as draft
        isPublished: false,
        groupId,
        mailketingListId,
        mailketingListName,
        mentorCommissionPercent: settings.defaultMentorCommission,
        approvedBy: user.role === 'ADMIN' ? session.user.id : null,
        approvedAt: user.role === 'ADMIN' ? new Date() : null
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      course
    })
  } catch (error) {
    console.error('POST /api/admin/courses error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
