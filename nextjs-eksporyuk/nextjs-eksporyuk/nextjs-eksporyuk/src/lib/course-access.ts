/**
 * Course Access Helper
 * PRD Perbaikan Fitur Kelas - Ekspor Yuk Platform
 * 
 * Helper functions untuk validasi akses kelas berdasarkan:
 * - Role user (ADMIN, AFFILIATE, MEMBER, PUBLIC)
 * - Status membership aktif
 * - Status kelas (DRAFT, PUBLISHED, PRIVATE)
 * - roleAccess setting (PUBLIC, MEMBER, AFFILIATE)
 * - Kepemilikan/enrollment kelas
 */

import { prisma } from '@/lib/prisma'

export type CourseAccessResult = {
  canAccess: boolean
  canView: boolean // Bisa lihat preview tapi tidak konten
  reason?: string
  accessType?: 'free' | 'membership' | 'purchased' | 'affiliate' | 'admin'
}

export type UserContext = {
  id: string
  role: string
  isAuthenticated: boolean
}

/**
 * Check if user can access a specific course
 */
export async function checkCourseAccess(
  courseId: string,
  user: UserContext | null
): Promise<CourseAccessResult> {
  // Get course with required data
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      status: true,
      roleAccess: true,
      affiliateOnly: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true,
      membershipIncluded: true,
      isPublicListed: true,
      monetizationType: true,
      price: true,
      membershipCourses: {
        select: {
          membershipId: true,
          membership: {
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  if (!course) {
    return { canAccess: false, canView: false, reason: 'Kelas tidak ditemukan' }
  }

  // 1. Status Check - Draft tidak bisa diakses kecuali admin
  if (course.status === 'DRAFT') {
    if (user?.role === 'ADMIN') {
      return { canAccess: true, canView: true, accessType: 'admin' }
    }
    return { canAccess: false, canView: false, reason: 'Kelas ini masih dalam draft' }
  }

  // 2. Admin always has access
  if (user?.role === 'ADMIN') {
    return { canAccess: true, canView: true, accessType: 'admin' }
  }

  // 3. Affiliate-only courses
  if (course.affiliateOnly || course.isAffiliateTraining || course.isAffiliateMaterial || course.roleAccess === 'AFFILIATE') {
    if (!user?.isAuthenticated) {
      return { canAccess: false, canView: false, reason: 'Silakan login untuk mengakses kelas ini' }
    }
    
    const affiliateRoles = ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!affiliateRoles.includes(user.role)) {
      return { 
        canAccess: false, 
        canView: false, 
        reason: 'Kelas ini hanya untuk Affiliate. Anda tidak memiliki izin.' 
      }
    }
    return { canAccess: true, canView: true, accessType: 'affiliate' }
  }

  // 4. Member-only courses
  if (course.roleAccess === 'MEMBER') {
    if (!user?.isAuthenticated) {
      return { 
        canAccess: false, 
        canView: true, // Preview only
        reason: 'Kelas ini hanya untuk Member. Silakan login atau upgrade membership.' 
      }
    }

    // Check if user has active membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })

    if (userMembership) {
      return { canAccess: true, canView: true, accessType: 'membership' }
    }

    // Check if user purchased this course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      }
    })

    if (enrollment) {
      return { canAccess: true, canView: true, accessType: 'purchased' }
    }

    return { 
      canAccess: false, 
      canView: true, 
      reason: 'Kelas ini hanya untuk Member Premium. Silakan upgrade membership Anda.' 
    }
  }

  // 5. Private courses - only specific access
  if (course.status === 'PRIVATE') {
    if (!user?.isAuthenticated) {
      return { canAccess: false, canView: false, reason: 'Kelas ini bersifat privat' }
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      }
    })

    if (enrollment) {
      return { canAccess: true, canView: true, accessType: 'purchased' }
    }

    return { canAccess: false, canView: false, reason: 'Anda tidak memiliki akses ke kelas ini' }
  }

  // 6. Public courses with membershipIncluded
  if (course.membershipIncluded && user?.isAuthenticated) {
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })

    if (userMembership) {
      return { canAccess: true, canView: true, accessType: 'membership' }
    }
  }

  // 7. Free courses
  if (course.monetizationType === 'FREE' || Number(course.price) === 0) {
    if (user?.isAuthenticated) {
      return { canAccess: true, canView: true, accessType: 'free' }
    }
    // Non-authenticated can view but need to login to access content
    return { 
      canAccess: false, 
      canView: true, 
      reason: 'Silakan login untuk mengakses kelas gratis ini' 
    }
  }

  // 8. Paid courses - check enrollment
  if (user?.isAuthenticated) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      }
    })

    if (enrollment) {
      return { canAccess: true, canView: true, accessType: 'purchased' }
    }
  }

  // Default - can view preview but no access
  return { 
    canAccess: false, 
    canView: true, 
    reason: user?.isAuthenticated 
      ? 'Anda belum membeli kelas ini' 
      : 'Silakan login untuk membeli kelas ini' 
  }
}

/**
 * Get courses filtered by user role and access
 * For public listing page
 */
export async function getAccessibleCourses(user: UserContext | null) {
  const baseWhere: any = {
    status: { in: ['PUBLISHED', 'APPROVED'] },
    isPublicListed: true
  }

  // Exclude affiliate-only courses from public listing
  baseWhere.affiliateOnly = false
  baseWhere.isAffiliateTraining = false
  baseWhere.isAffiliateMaterial = false
  baseWhere.roleAccess = { not: 'AFFILIATE' }

  // If user is not member, also exclude MEMBER-only courses from full listing
  // (they can still be shown as preview)
  if (!user?.isAuthenticated) {
    // Show all public courses but will need to filter access on detail page
  }

  return baseWhere
}

/**
 * Check if member gets free access to a course
 */
export async function checkMembershipCourseAccess(
  userId: string,
  courseId: string
): Promise<boolean> {
  // Check if user has active membership
  const userMembership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    },
    select: {
      membership: {
        select: {
          id: true
        }
      }
    }
  })

  if (!userMembership) return false

  // Check if course is included in membership (fetch from junction table separately)
  const membershipCourses = await prisma.membershipCourse.findMany({
    where: {
      membershipId: userMembership.membership.id,
      courseId: courseId
    }
  })

  if (membershipCourses.length > 0) return true

  // Check if course has membershipIncluded flag
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { membershipIncluded: true }
  })

  return course?.membershipIncluded ?? false
}

/**
 * Get affiliate training courses
 */
export async function getAffiliateTrainingCourses(userId: string) {
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { affiliateOnly: true },
        { isAffiliateTraining: true },
        { isAffiliateMaterial: true },
        { roleAccess: 'AFFILIATE' }
      ],
      status: { in: ['PUBLISHED', 'APPROVED'] }
    },
    include: {
      modules: {
        include: {
          lessons: true
        }
      },
      enrollments: {
        where: { userId }
      },
      userProgress: {
        where: { userId }
      }
    },
    orderBy: [
      { isAffiliateTraining: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  return courses
}

/**
 * Get member courses (from membership + purchased)
 */
export async function getMemberCourses(userId: string) {
  // Get user's membership
  const userMembership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE'
    },
    select: {
      membership: {
        select: {
          id: true
        }
      }
    }
  })

  // Get user's membership courses (from junction table)
  let membershipCourses: any[] = []
  if (userMembership) {
    const membershipCoursesData = await prisma.membershipCourse.findMany({
      where: {
        membershipId: userMembership.membership.id
      },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: true }
            },
            mentor: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true }
                }
              }
            }
          }
        }
      }
    })
    membershipCourses = membershipCoursesData.map(mc => mc.course)
  }

  // Get purchased courses
  const purchasedCourses = await prisma.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: true }
          },
          mentor: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        }
      }
    }
  })

  // Get courses with membershipIncluded flag
  const membershipIncludedCourses = userMembership ? await prisma.course.findMany({
    where: {
      membershipIncluded: true,
      status: { in: ['PUBLISHED', 'APPROVED'] }
    },
    include: {
      modules: {
        include: { lessons: true }
      },
      mentor: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }
    }
  }) : []

  return {
    membershipCourses,
    purchasedCourses: purchasedCourses.map(e => e.course),
    membershipIncludedCourses,
    hasMembership: !!userMembership
  }
}
