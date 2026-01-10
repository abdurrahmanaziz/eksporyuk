import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membershipId = params.id

    // Verify user has this membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        membershipId: membershipId,
        status: 'ACTIVE',
      },
    })

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Membership not found or not active' },
        { status: 403 }
      )
    }

    // Get courses included in this membership
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId },
      orderBy: { createdAt: 'desc' }
    })

    // Batch fetch courses
    const courseIds = membershipCourses.map(mc => mc.courseId)
    const coursesRaw = courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } }
        })
      : []

    // Batch fetch mentors
    const mentorIds = [...new Set(coursesRaw.filter(c => c.mentorId).map(c => c.mentorId as string))]
    const mentorProfiles = mentorIds.length > 0
      ? await prisma.mentorProfile.findMany({
          where: { id: { in: mentorIds } },
          select: { id: true, userId: true }
        })
      : []
    const mentorUserIds = mentorProfiles.map(mp => mp.userId)
    const mentorUsers = mentorUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: mentorUserIds } },
          select: { id: true, name: true }
        })
      : []

    // Batch fetch lessons count per course
    const lessonCounts = courseIds.length > 0
      ? await prisma.courseLesson.groupBy({
          by: ['moduleId'],
          where: { 
            module: { courseId: { in: courseIds } }
          },
          _count: true
        })
      : []

    // Actually count lessons per course (via modules)
    const modules = courseIds.length > 0
      ? await prisma.courseModule.findMany({
          where: { courseId: { in: courseIds } },
          select: { id: true, courseId: true }
        })
      : []
    const moduleIds = modules.map(m => m.id)
    const lessons = moduleIds.length > 0
      ? await prisma.courseLesson.findMany({
          where: { moduleId: { in: moduleIds } },
          select: { id: true, moduleId: true }
        })
      : []

    // Map module to course
    const moduleToCourse = new Map(modules.map(m => [m.id, m.courseId]))
    const lessonCountByCourse = new Map<string, number>()
    for (const lesson of lessons) {
      const courseId = moduleToCourse.get(lesson.moduleId)
      if (courseId) {
        lessonCountByCourse.set(courseId, (lessonCountByCourse.get(courseId) || 0) + 1)
      }
    }

    // Batch fetch enrollments
    const enrollments = courseIds.length > 0
      ? await prisma.courseEnrollment.findMany({
          where: {
            userId: session.user.id,
            courseId: { in: courseIds }
          }
        })
      : []

    // Batch fetch lesson progress for user's enrollments
    const enrollmentIds = enrollments.map(e => e.id)
    const lessonProgress = enrollmentIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: { enrollmentId: { in: enrollmentIds } },
          select: { enrollmentId: true, lessonId: true, isCompleted: true }
        })
      : []

    // Create lookup maps
    const courseMap = new Map(coursesRaw.map(c => [c.id, c]))
    const mentorProfileMap = new Map(mentorProfiles.map(mp => [mp.id, mp]))
    const mentorUserMap = new Map(mentorUsers.map(u => [u.id, u]))
    const enrollmentMap = new Map(enrollments.map(e => [e.courseId, e]))
    
    // Group lesson progress by enrollment
    const progressByEnrollment = new Map<string, typeof lessonProgress>()
    for (const lp of lessonProgress) {
      const existing = progressByEnrollment.get(lp.enrollmentId) || []
      existing.push(lp)
      progressByEnrollment.set(lp.enrollmentId, existing)
    }

    const courses = membershipCourses.map((mc) => {
      const course = courseMap.get(mc.courseId)
      if (!course) return null

      const mentorProfile = course.mentorId ? mentorProfileMap.get(course.mentorId) : null
      const mentorUser = mentorProfile ? mentorUserMap.get(mentorProfile.userId) : null
      const enrollment = enrollmentMap.get(course.id)
      const totalLessons = lessonCountByCourse.get(course.id) || 0
      const enrollmentProgress = enrollment ? (progressByEnrollment.get(enrollment.id) || []) : []
      const completedLessons = enrollmentProgress.filter((lp) => lp.isCompleted).length
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        description: course.description,
        mentorName: mentorUser?.name || null,
        totalLessons,
        completedLessons,
        progress,
        isEnrolled: !!enrollment,
        lastAccessedAt: enrollment?.lastAccessedAt || null,
      }
    }).filter(Boolean)

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching membership courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
