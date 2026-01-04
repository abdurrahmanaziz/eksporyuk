import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's courses from both CourseEnrollment and UserCourseProgress
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Also get from UserCourseProgress (for courses added via seed/progress tracking)
    const userCourseProgress = await prisma.userCourseProgress.findMany({
      where: { 
        userId,
        hasAccess: true 
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    })

    // Combine courses from both sources, deduplicating by course id
    const courseMap = new Map<string, any>()

    // Add from enrollments
    enrollments.forEach(enrollment => {
      const totalLessons = enrollment.course.modules.reduce(
        (acc, mod) => acc + mod.lessons.length, 0
      )
      const progressPercent = 0 // Will be calculated from lesson progress

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED'

      courseMap.set(enrollment.course.id, {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        thumbnail: enrollment.course.thumbnail,
        progress: progressPercent,
        totalLessons,
        completedLessons: 0,
        lastAccessedAt: enrollment.updatedAt?.toISOString() || null,
        status
      })
    })

    // Add from UserCourseProgress (will override or add new)
    userCourseProgress.forEach(ucp => {
      const totalLessons = ucp.course.modules.reduce(
        (acc, mod) => acc + mod.lessons.length, 0
      )
      
      // Use progress from UserCourseProgress if available
      const completedLessonsArr = (ucp.completedLessons as string[]) || []
      const completedLessonsCount = completedLessonsArr.length
      const progressPercent = ucp.progress || (totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0)

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED'
      if (ucp.isCompleted || progressPercent === 100) {
        status = 'COMPLETED'
      } else if (progressPercent > 0) {
        status = 'IN_PROGRESS'
      }

      courseMap.set(ucp.course.id, {
        id: ucp.course.id,
        title: ucp.course.title,
        slug: ucp.course.slug,
        thumbnail: ucp.course.thumbnail,
        progress: progressPercent,
        totalLessons,
        completedLessons: completedLessonsCount,
        lastAccessedAt: ucp.lastAccessedAt?.toISOString() || null,
        status
      })
    })

    const courses = Array.from(courseMap.values())

    // Get user's groups
    const groupMemberships = await prisma.groupMember.findMany({
      where: { 
        userId
      },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                posts: true
              }
            }
          }
        }
      },
      take: 4
    })

    const groups = groupMemberships.map(gm => ({
      id: gm.group.id,
      slug: gm.group.slug,
      name: gm.group.name,
      description: gm.group.description,
      thumbnail: gm.group.avatar || gm.group.coverImage,
      memberCount: gm.group._count.members,
      postCount: gm.group._count.posts
    }))

    // Get upcoming events
    const now = new Date()
    const events = await prisma.event.findMany({
      where: {
        startDate: { gte: now },
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        thumbnail: true,
        type: true
      },
      orderBy: { startDate: 'asc' },
      take: 5
    })

    // Get recommended products (published products)
    const products = await prisma.product.findMany({
      where: {
        productStatus: 'PUBLISHED',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnail: true,
        price: true,
        originalPrice: true,
        category: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get user's membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      orderBy: { endDate: 'desc' }
    })

    // Query membership separately if exists
    let membership = null
    if (userMembership) {
      membership = await prisma.membership.findUnique({
        where: { id: userMembership.membershipId }
      })
    }

    // Get certificates count
    const certificatesCount = await prisma.certificate.count({
      where: { userId }
    })

    // Calculate stats
    const totalCourses = courses.length
    const completedCourses = courses.filter((c: any) => c.status === 'COMPLETED').length
    const totalLessons = courses.reduce((acc: number, c: any) => acc + c.totalLessons, 0)
    const completedLessons = courses.reduce((acc: number, c: any) => acc + c.completedLessons, 0)
    
    // Days remaining in membership
    let daysRemaining = 0
    if (userMembership?.endDate) {
      const diffTime = new Date(userMembership.endDate).getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }

    // Get announcements (from banners marked as announcement or high priority)
    const announcements = await prisma.banner.findMany({
      where: {
        isActive: true,
        placement: 'DASHBOARD',
        priority: { gte: 8 }
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        priority: true
      },
      orderBy: { priority: 'desc' },
      take: 3
    })

    return NextResponse.json({
      courses,
      groups,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() || null,
        location: e.location,
        thumbnail: e.thumbnail,
        isOnline: e.type === 'WEBINAR'
      })),
      products: products.map(p => ({
        ...p,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null
      })),
      stats: {
        totalCourses,
        completedCourses,
        totalLessons,
        completedLessons,
        certificates: certificatesCount,
        daysRemaining
      },
      membership: userMembership && membership ? {
        name: membership.name,
        expiresAt: userMembership.endDate?.toISOString() || null,
        isExpired: userMembership.status !== 'ACTIVE'
      } : null,
      announcements: announcements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.description || '',
        createdAt: a.createdAt.toISOString(),
        priority: a.priority >= 9 ? 'HIGH' : 'NORMAL'
      }))
    })

  } catch (error) {
    console.error('Error fetching premium dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
