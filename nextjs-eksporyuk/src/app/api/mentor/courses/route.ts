import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { createUniqueSlug } from '@/lib/slug-utils'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
        mentorId: true,
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
      slug: requestSlug, // Optional slug from request
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

    // Validate required fields with detailed error response
    const validationErrors: Record<string, string[]> = {}
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      validationErrors.title = ['Judul kursus wajib diisi']
    } else if (title.trim().length < 3) {
      validationErrors.title = ['Judul kursus minimal 3 karakter']
    }
    
    if (!description || typeof description !== 'string' || !description.trim()) {
      validationErrors.description = ['Deskripsi kursus wajib diisi']
    } else if (description.trim().length < 10) {
      validationErrors.description = ['Deskripsi kursus minimal 10 karakter']
    }
    
    // Only validate price for PAID monetization type
    if (monetizationType === 'PAID') {
      if (price === undefined || price === null) {
        validationErrors.price = ['Harga wajib diisi untuk kursus berbayar']
      } else if (isNaN(Number(price)) || Number(price) < 0) {
        validationErrors.price = ['Harga harus berupa angka dan tidak boleh negatif']
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      console.error('Validation failed:', validationErrors)
      return NextResponse.json(
        { 
          error: 'Validasi gagal',
          validation: validationErrors 
        },
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
          updatedAt: new Date()
        },
      })
    }

    // Get or create mentor profile for current user
    let mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!mentorProfile) {
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          id: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          bio: '',
          expertise: '',
          isActive: true,
          updatedAt: new Date()
        }
      })
    }

    const finalMentorId = mentorId || mentorProfile.id

    // Generate unique slug from title or use provided slug
    const slug = requestSlug || await createUniqueSlug(title, 'course')
    
    // Generate unique course ID
    const courseId = `crs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('Using mentor ID:', finalMentorId)

    // Set price to 0 for FREE and AFFILIATE types
    const finalPrice = (monetizationType === 'FREE' || monetizationType === 'AFFILIATE') ? 0 : (price || 0)

    // Create course
    const course = await prisma.course.create({
      data: {
        id: courseId,
        mentorId: finalMentorId,
        title,
        slug,
        description,
        thumbnail,
        price: finalPrice,
        originalPrice: originalPrice || finalPrice,
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
        approvedAt: user.role === 'ADMIN' ? new Date() : null,
        updatedAt: new Date()
      }
    })

    // Create primary mentor relationship
    await prisma.courseMentor.create({
      data: {
        id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId: course.id,
        mentorId: mentorProfile.id,
        role: 'MENTOR',
        isActive: true,
        updatedAt: new Date()
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
