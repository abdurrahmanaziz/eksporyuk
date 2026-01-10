import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all enrollments for the user - NO RELATIONS in schema
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (enrollments.length === 0) {
      return NextResponse.json({ enrollments: [] })
    }

    // Get course IDs
    const courseIds = enrollments.map(e => e.courseId)

    // Fetch courses separately
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        isPublished: true
      }
    })

    // Fetch modules for these courses
    const modules = await prisma.courseModule.findMany({
      where: {
        courseId: { in: courseIds }
      },
      orderBy: { order: 'asc' }
    })

    // Fetch lessons for these modules
    const moduleIds = modules.map(m => m.id)
    const lessons = await prisma.courseLesson.findMany({
      where: {
        moduleId: { in: moduleIds }
      },
      select: {
        id: true,
        title: true,
        moduleId: true
      }
    })

    // Get certificates for all enrolled courses
    const certificates = await prisma.certificate.findMany({
      where: {
        userId: session.user.id,
        courseId: { in: courseIds }
      },
      select: {
        courseId: true
      }
    })

    // Build maps for efficient lookup
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const certificateMap = new Map(certificates.map(c => [c.courseId, true]))
    
    // Group lessons by module
    const lessonsByModule = new Map<string, typeof lessons>()
    lessons.forEach(lesson => {
      const existing = lessonsByModule.get(lesson.moduleId) || []
      existing.push(lesson)
      lessonsByModule.set(lesson.moduleId, existing)
    })

    // Group modules by course
    const modulesByCourse = new Map<string, (typeof modules[0] & { lessons: typeof lessons })[]>()
    modules.forEach(module => {
      const existing = modulesByCourse.get(module.courseId) || []
      existing.push({
        ...module,
        lessons: lessonsByModule.get(module.id) || []
      })
      modulesByCourse.set(module.courseId, existing)
    })

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = enrollments
      .filter(enrollment => courseMap.has(enrollment.courseId)) // Only include if course exists and published
      .map(enrollment => {
        const course = courseMap.get(enrollment.courseId)!
        const courseModules = modulesByCourse.get(enrollment.courseId) || []
        
        const totalLessons = courseModules.reduce(
          (total, module) => total + module.lessons.length,
          0
        )
        const progress = enrollment.progress || 0

        return {
          courseId: enrollment.courseId,
          course: {
            ...course,
            modules: courseModules
          },
          completedLessons: Math.round((progress / 100) * totalLessons),
          totalLessons,
          lastAccessed: enrollment.updatedAt,
          progress,
          certificateIssued: certificateMap.has(enrollment.courseId) || enrollment.completed
        }
      })

    return NextResponse.json({
      enrollments: enrollmentsWithProgress
    })

  } catch (error) {
    console.error('Error fetching my courses:', error)
    // Return safe empty result instead of error
    return NextResponse.json({ enrollments: [] }, { status: 200 })
  }
}
