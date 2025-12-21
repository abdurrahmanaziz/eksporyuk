import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

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
        // PRD Perbaikan Fitur Kelas - field baru
        roleAccess: true,
        membershipIncluded: true,
        isPublicListed: true,
        affiliateOnly: true,
        isAffiliateTraining: true,
        isAffiliateMaterial: true,
        _count: {
          select: {
            transactions: true
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
        status: 'APPROVED', // Admin-created courses are auto-approved
        isPublished: false, // But not auto-published
        groupId,
        mailketingListId,
        mailketingListName,
        mentorCommissionPercent: settings.defaultMentorCommission, // Use default from settings
        commissionType: commissionType || 'PERCENTAGE',
        affiliateCommissionRate: affiliateCommissionRate || 30,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        // PRD Perbaikan Fitur Kelas - field baru
        roleAccess: roleAccess || 'PUBLIC',
        membershipIncluded: membershipIncluded ?? false,
        isPublicListed: isPublicListed ?? true,
        affiliateOnly: affiliateOnly ?? false,
        isAffiliateTraining: isAffiliateTraining ?? false,
        isAffiliateMaterial: isAffiliateMaterial ?? false
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
