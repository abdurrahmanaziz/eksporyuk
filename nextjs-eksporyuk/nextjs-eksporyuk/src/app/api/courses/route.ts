import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/courses
 * Public courses listing dengan role-based filtering
 * PRD Perbaikan Fitur Kelas
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const roleAccess = searchParams.get('roleAccess')
    const includeAffiliate = searchParams.get('includeAffiliate') === 'true'
    const forAffiliate = searchParams.get('forAffiliate') === 'true'
    const slug = searchParams.get('slug')

    const where: any = {}

    // For affiliate link generation - only show courses with affiliateEnabled=true
    if (forAffiliate) {
      where.affiliateEnabled = true
      where.isPublished = true
    }

    // Query by specific slug (untuk course detail page)
    if (slug) {
      where.slug = slug
      
      // PRD: DRAFT hanya bisa dilihat admin
      // PRIVATE bisa diakses via direct link jika user memenuhi syarat
      if (!session?.user || !['ADMIN', 'MENTOR'].includes(session.user.role)) {
        // Non-admin tidak bisa akses DRAFT atau ARCHIVED
        where.status = { notIn: ['DRAFT', 'ARCHIVED'] }
      }
    } else {
      // Listing courses

      // 1. Status filter - PRD: DRAFT tidak tampil, PRIVATE tidak tampil di listing
      if (status) {
        where.status = status
      } else {
        // Default: only show PUBLISHED/APPROVED courses for non-admin
        // DRAFT = belum dipublikasikan, tidak tampil
        // PRIVATE = tidak tampil di listing (hanya via direct link)
        // ARCHIVED = diarsipkan, tidak aktif
        if (!session?.user || !['ADMIN', 'MENTOR'].includes(session.user.role)) {
          where.status = { in: ['PUBLISHED', 'APPROVED'] }
        }
      }

      // 2. Role-based filtering untuk public listing
      if (!session?.user || !['ADMIN', 'MENTOR'].includes(session.user.role)) {
        // User role untuk filtering
        const userRole = session?.user?.role || 'GUEST'
        
        // Check if user has active membership
        let hasActiveMembership = false
        if (session?.user?.id) {
          const activeMembership = await prisma.userMembership.findFirst({
            where: {
              userId: session.user.id,
              status: 'ACTIVE',
              endDate: { gte: new Date() }
            }
          })
          hasActiveMembership = !!activeMembership
        }
        
        // Build role-based filters
        const roleFilters: any[] = []
        
        // 1. Exclude affiliate-only courses if user is not affiliate
        if (userRole !== 'AFFILIATE') {
          roleFilters.push({
            affiliateOnly: false
          })
          roleFilters.push({
            isAffiliateTraining: false
          })
          roleFilters.push({
            isAffiliateMaterial: false
          })
        }
        
        // 2. Filter based on roleAccess
        const allowedRoleAccess: any[] = ['PUBLIC']
        
        if (userRole === 'AFFILIATE') {
          allowedRoleAccess.push('AFFILIATE')
        }
        
        if (hasActiveMembership || ['MEMBER_PREMIUM', 'MEMBER_FREE'].includes(userRole)) {
          allowedRoleAccess.push('MEMBER')
        }
        
        // 3. Combine filters
        where.AND = [
          {
            OR: [
              { roleAccess: { in: allowedRoleAccess } },
              // Allow if any affiliate flags are false (for non-affiliates)
              ...(userRole !== 'AFFILIATE' ? [{
                AND: [
                  { affiliateOnly: false },
                  { isAffiliateTraining: false },
                  { isAffiliateMaterial: false }
                ]
              }] : [])
            ]
          },
          // Only show publicly listed courses
          { isPublicListed: true }
        ]
      }

      // 3. Specific roleAccess filter
      if (roleAccess) {
        where.roleAccess = roleAccess
      }
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        price: true,
        originalPrice: true,
        status: true,
        monetizationType: true,
        roleAccess: true,
        membershipIncluded: true,
        isPublicListed: true,
        affiliateOnly: true,
        isAffiliateTraining: true,
        level: true,
        duration: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get enrollments and modules count separately
    const coursesWithCounts = await Promise.all(courses.map(async (course) => {
      const [enrollmentCount, moduleCount, userEnrollment] = await Promise.all([
        prisma.courseEnrollment.count({ where: { courseId: course.id } }),
        prisma.courseModule.count({ where: { courseId: course.id } }),
        session?.user?.id ? prisma.courseEnrollment.findFirst({
          where: {
            courseId: course.id,
            userId: session.user.id
          },
          select: { id: true }
        }) : Promise.resolve(null)
      ])

      return {
        ...course,
        _count: {
          enrollments: enrollmentCount,
          modules: moduleCount
        },
        enrollments: userEnrollment ? [userEnrollment] : []
      }
    }))

    // Add access info for each course
    const coursesWithAccess = await Promise.all(coursesWithCounts.map(async (course) => {
      let accessStatus = 'preview' // Default: can preview
      let isFreeForUser = false

      if (session?.user?.id) {
        // Check if enrolled
        const enrolled = course.enrollments && course.enrollments.length > 0
        if (enrolled) {
          accessStatus = 'enrolled'
        }

        // Check if member and course is membershipIncluded
        if (course.membershipIncluded) {
          const userMembership = await prisma.userMembership.findFirst({
            where: {
              userId: session.user.id,
              status: 'ACTIVE'
            }
          })
          if (userMembership) {
            accessStatus = 'membership'
            isFreeForUser = true
          }
        }

        // Check if course is in user's membership package - MembershipCourse has no relations
        // First get user's active membership IDs
        const userMemberships = await prisma.userMembership.findMany({
          where: {
            userId: session.user.id,
            status: 'ACTIVE'
          },
          select: { membershipId: true }
        })
        
        if (userMemberships.length > 0) {
          const membershipIds = userMemberships.map(m => m.membershipId)
          const membershipCourse = await prisma.membershipCourse.findFirst({
            where: {
              courseId: course.id,
              membershipId: { in: membershipIds }
            }
          })
          if (membershipCourse) {
            accessStatus = 'membership'
            isFreeForUser = true
          }
        }
      }

      // Free courses
      if (course.monetizationType === 'FREE' || Number(course.price) === 0) {
        isFreeForUser = true
      }

      return {
        ...course,
        accessStatus,
        isFreeForUser
      }
    }))

    return NextResponse.json({ courses: coursesWithAccess })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
