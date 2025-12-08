import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Type for course with relations
interface CourseWithModules {
  id: string
  title: string
  slug: string | null
  description: string
  thumbnail: string | null
  duration: number | null
  level: string | null
  affiliateOnly: boolean
  isAffiliateTraining: boolean
  isAffiliateMaterial: boolean
  modules: Array<{
    id: string
    lessons: Array<{ id: string }>
  }>
}

/**
 * GET /api/affiliate/training
 * Get affiliate-only training courses
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    // Only affiliates and admins can access
    const allowedRoles = ['AFFILIATE', 'ADMIN', 'CO_FOUNDER', 'FOUNDER']
    if (!allowedRoles.includes(userRole || '')) {
      return NextResponse.json({ error: 'Access denied. Affiliate only.' }, { status: 403 })
    }

    // Get affiliate-only courses using raw query to bypass type issues
    // @ts-ignore - Prisma types cache issue, fields exist in schema
    const courses = await prisma.course.findMany({
      where: {
        // @ts-ignore
        affiliateOnly: true,
        isPublished: true,
        status: 'PUBLISHED',
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
      orderBy: [
        // @ts-ignore
        { isAffiliateTraining: 'desc' },
        { createdAt: 'asc' },
      ],
    }) as unknown as CourseWithModules[]

    // Get enrollments for current user
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        courseId: { in: courses.map(c => c.id) },
      },
    })

    // Get user progress for these courses
    const progressRecords = await prisma.userCourseProgress.findMany({
      where: {
        userId,
        courseId: { in: courses.map(c => c.id) },
      },
    })

    // Get certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        userId,
        courseId: { in: courses.map(c => c.id) },
      },
    })

    // Format response
    const formattedCourses = courses.map(course => {
      const enrollment = enrollments.find(e => e.courseId === course.id)
      const progress = progressRecords.find(p => p.courseId === course.id)
      const certificate = certificates.find(c => c.courseId === course.id)
      
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnail: course.thumbnail,
        duration: course.duration,
        level: course.level,
        modulesCount: course.modules.length,
        lessonsCount: totalLessons,
        isEnrolled: !!enrollment,
        progress: progress?.progress || 0,
        isCompleted: progress?.isCompleted || false,
        hasCertificate: !!certificate,
        isMainTraining: course.isAffiliateTraining,
        isLearningMaterial: course.isAffiliateMaterial,
      }
    })

    // Separate into training (wajib) and learning materials (opsional)
    const trainingCourses = formattedCourses.filter(c => c.isMainTraining)
    const learningMaterials = formattedCourses.filter(c => c.isLearningMaterial)
    const otherCourses = formattedCourses.filter(c => !c.isMainTraining && !c.isLearningMaterial)

    return NextResponse.json({ 
      courses: formattedCourses,
      trainingCourses, // Training wajib
      learningMaterials, // Materi belajar opsional
      otherCourses // Kursus affiliate-only lainnya
    })
  } catch (error) {
    console.error('Error fetching training courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training courses' },
      { status: 500 }
    )
  }
}
