import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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

    const where: any = {}

    // 1. Status filter
    if (status) {
      where.status = status
    } else {
      // Default: only show published courses for non-admin
      if (!session?.user || !['ADMIN', 'MENTOR'].includes(session.user.role)) {
        where.status = { in: ['PUBLISHED', 'APPROVED'] }
      }
    }

    // 2. Role-based filtering untuk public listing
    if (!session?.user || !['ADMIN', 'MENTOR'].includes(session.user.role)) {
      // Exclude affiliate-only courses dari listing publik
      if (!includeAffiliate) {
        where.affiliateOnly = false
        where.isAffiliateTraining = false
        where.isAffiliateMaterial = false
        where.roleAccess = { not: 'AFFILIATE' }
      }
      
      // Only show publicly listed courses
      where.isPublicListed = true
    }

    // 3. Specific roleAccess filter
    if (roleAccess) {
      where.roleAccess = roleAccess
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
        _count: {
          select: {
            enrollments: true,
            modules: true
          }
        },
        ...(session?.user?.id && {
          enrollments: {
            where: {
              userId: session.user.id
            },
            select: {
              id: true
            }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add access info for each course
    const coursesWithAccess = await Promise.all(courses.map(async (course) => {
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

        // Check if course is in user's membership package
        const membershipCourse = await prisma.membershipCourse.findFirst({
          where: {
            courseId: course.id,
            membership: {
              userMemberships: {
                some: {
                  userId: session.user.id,
                  status: 'ACTIVE'
                }
              }
            }
          }
        })
        if (membershipCourse) {
          accessStatus = 'membership'
          isFreeForUser = true
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
