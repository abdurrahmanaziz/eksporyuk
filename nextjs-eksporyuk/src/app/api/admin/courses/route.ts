import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { createUniqueSlug } from '@/lib/slug-utils'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/courses - Get all courses with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get transaction counts manually (no relations in schema)
    const courseIds = courses.map(c => c.id)
    const transactionCounts = courseIds.length > 0 ? await prisma.transaction.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: true
    }) : []
    const countMap = new Map(transactionCounts.map(c => [c.courseId, c._count]))

    // Get course mentors
    const courseMentors = courseIds.length > 0 ? await prisma.courseMentor.findMany({
      where: { 
        courseId: { in: courseIds },
        isActive: true 
      }
    }) : []

    // Get mentor profiles and users
    const mentorIds = courseMentors.map(cm => cm.mentorId)
    const mentorProfiles = mentorIds.length > 0 ? await prisma.mentorProfile.findMany({
      where: { id: { in: mentorIds } }
    }) : []

    const userIds = mentorProfiles.map(mp => mp.userId)
    const mentorUsers = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatar: true }
    }) : []

    const mentorUserMap = new Map(mentorUsers.map(u => [u.id, u]))
    const mentorProfileMap = new Map(mentorProfiles.map(mp => [mp.id, mp]))

    // Group mentors by course
    const courseMentorMap = new Map()
    courseMentors.forEach(cm => {
      if (!courseMentorMap.has(cm.courseId)) {
        courseMentorMap.set(cm.courseId, [])
      }
      const mentorProfile = mentorProfileMap.get(cm.mentorId)
      const user = mentorProfile ? mentorUserMap.get(mentorProfile.userId) : null
      
      if (mentorProfile && user) {
        courseMentorMap.get(cm.courseId).push({
          id: cm.id,
          mentorId: cm.mentorId,
          role: cm.role,
          mentor: {
            ...mentorProfile,
            user: user
          }
        })
      }
    })

    // Map course data with mentors and transaction counts
    const coursesWithData = courses.map(course => ({
      ...course,
      mentors: courseMentorMap.get(course.id) || [],
      _count: {
        transactions: countMap.get(course.id) || 0
      }
    }))
    return NextResponse.json({ 
      success: true,
      courses: coursesWithData 
    })
  } catch (error) {
    console.error('GET /api/admin/courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses - Create new course (by admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      mailketingListName,
      commissionType,
      affiliateCommissionRate,
      affiliateCommissionType,
      affiliateEnabled,
      membershipIds, // Array of membership IDs for MEMBERSHIP type
      // PRD Perbaikan Fitur Kelas - field baru
      roleAccess,
      membershipIncluded,
      isPublicListed,
      affiliateOnly,
      isAffiliateTraining,
      isAffiliateMaterial
    } = body

    console.log('POST /api/admin/courses - Received body:', body)

    // Validate required fields
    if (!title || !description) {
      console.error('Validation failed:', { title, description })
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Validate price only for PAID monetization type
    if (monetizationType === 'PAID' && (price === undefined || price === null)) {
      console.error('Price required for PAID type:', { monetizationType, price })
      return NextResponse.json(
        { error: 'Price is required for paid courses' },
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

    // If admin doesn't specify mentor, use their own mentor profile or create one
    let finalMentorId = mentorId
    if (!finalMentorId) {
      // Check if admin has mentor profile
      const adminMentor = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (adminMentor) {
        finalMentorId = adminMentor.id
      } else {
        // Create mentor profile for admin
        const newMentor = await prisma.mentorProfile.create({
          data: {
            userId: session.user.id,
            bio: 'Administrator',
            expertise: 'All topics',
            isActive: true
          }
        })
        finalMentorId = newMentor.id
      }
    }

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
        status: 'APPROVED', // Admin-created courses are auto-approved
        isPublished: false, // But not auto-published
        groupId,
        mailketingListId,
        mailketingListName,
        mentorCommissionPercent: settings.defaultMentorCommission, // Use default from settings
        commissionType: affiliateCommissionType || commissionType || 'PERCENTAGE',
        affiliateCommissionRate: affiliateCommissionRate || 30,
        affiliateEnabled: affiliateEnabled ?? true,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(), // Required field without @updatedAt directive
        // PRD Perbaikan Fitur Kelas - field baru
        roleAccess: roleAccess || 'PUBLIC',
        membershipIncluded: membershipIncluded ?? false,
        isPublicListed: isPublicListed ?? true,
        affiliateOnly: affiliateOnly ?? false,
        isAffiliateTraining: isAffiliateTraining ?? false,
        isAffiliateMaterial: isAffiliateMaterial ?? false
      }
    })

    // If MEMBERSHIP type and membershipIds provided, create course-membership relations
    if (monetizationType === 'MEMBERSHIP' && membershipIds && membershipIds.length > 0) {
      // Check if CourseMembership model exists, if so create relations
      try {
        for (const membershipId of membershipIds) {
          await prisma.courseMembership.create({
            data: {
              id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              courseId: course.id,
              membershipId: membershipId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
        console.log('Created course-membership relations:', membershipIds.length)
      } catch (err) {
        console.log('CourseMembership model may not exist:', err)
        // Continue without error - model might not exist yet
      }
    }

    // Fetch mentor data separately for response
    let mentorData = null
    if (course.mentorId) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: course.mentorId }
      })
      if (mentor) {
        const user = await prisma.user.findUnique({
          where: { id: mentor.userId },
          select: { name: true, email: true }
        })
        mentorData = { ...mentor, user }
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        mentor: mentorData
      }
    })
  } catch (error) {
    console.error('POST /api/admin/courses error:', error)
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { 
        error: 'Failed to create course',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
