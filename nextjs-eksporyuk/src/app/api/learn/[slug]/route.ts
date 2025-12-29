import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/learn/[slug] - Get course details for learning (by slug)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const slug = params.slug
    
    console.log(`🔍 [API /learn/${slug}] Fetching course for user:`, session.user.email)

    // Fetch course without relations (Prisma schema doesn't have them defined)
    // Note: slug is not @unique in schema, so use findFirst
    const course = await prisma.course.findFirst({
      where: { 
        slug,
        // Only show PUBLISHED courses or if user is ADMIN/MENTOR
        ...(session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR' 
          ? { status: 'PUBLISHED', isPublished: true }
          : {}
        )
      }
    })

    if (!course) {
      console.log(`❌ [API /learn/${slug}] Course not found`)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    console.log(`✅ [API /learn/${slug}] Course found:`, course.title, 'Status:', course.status)

    // Fetch mentor profile separately
    const mentor = course.mentorId ? await prisma.mentorProfile.findUnique({
      where: { id: course.mentorId }
    }) : null

    // Fetch mentor user info if mentor exists
    const mentorUser = mentor ? await prisma.user.findUnique({
      where: { id: mentor.userId },
      select: { id: true, name: true, email: true, avatar: true }
    }) : null

    // Fetch modules for this course
    const modules = await prisma.courseModule.findMany({
      where: { courseId: course.id },
      orderBy: { order: 'asc' }
    })
    
    console.log(`📚 [API /learn/${slug}] Found ${modules.length} modules`)

    // Fetch lessons and files for each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await prisma.courseLesson.findMany({
          where: { moduleId: mod.id },
          orderBy: { order: 'asc' }
        })
        
        // Fetch files for each lesson
        const lessonsWithFiles = await Promise.all(
          lessons.map(async (lesson) => {
            const files = await prisma.lessonFile.findMany({
              where: { lessonId: lesson.id },
              orderBy: { order: 'asc' }
            })
            return { ...lesson, files }
          })
        )
        
        return { ...mod, lessons: lessonsWithFiles }
      })
    )
    
    const totalLessons = modulesWithLessons.reduce((sum, m) => sum + m.lessons.length, 0)
    console.log(`📖 [API /learn/${slug}] Total lessons: ${totalLessons}`)

    // Construct course with mentor and modules
    const courseWithRelations = {
      ...course,
      mentor: mentor ? { ...mentor, user: mentorUser } : null,
      modules: modulesWithLessons
    } as any

    // PRD: Check course status - DRAFT/ARCHIVED tidak bisa diakses kecuali admin
    if (['DRAFT', 'ARCHIVED'].includes(courseWithRelations.status)) {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
        return NextResponse.json({ 
          error: 'Kursus ini belum dipublikasikan atau tidak tersedia' 
        }, { status: 403 })
      }
    }

    // PRD: Check roleAccess - validasi akses berdasarkan role
    const courseRoleAccess = courseWithRelations.roleAccess || 'PUBLIC'
    
    // Track access for affiliate training auto-enroll
    let affiliateAutoEnrolled = false
    
    // AFFILIATE course - hanya affiliate yang bisa akses
    if (courseRoleAccess === 'AFFILIATE' || courseWithRelations.affiliateOnly || courseWithRelations.isAffiliateTraining || courseWithRelations.isAffiliateMaterial) {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'AFFILIATE' && session.user.role !== 'MENTOR') {
        return NextResponse.json({ 
          error: 'Anda tidak memiliki izin untuk mengakses kelas ini. Kelas ini khusus untuk Affiliate.' 
        }, { status: 403 })
      }
      
      // AUTO-ENROLL: Jika user adalah AFFILIATE dan ini training wajib, otomatis enroll
      if (session.user.role === 'AFFILIATE' && courseWithRelations.isAffiliateTraining) {
        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            userId: session.user.id,
            courseId: courseWithRelations.id
          }
        })

        if (!existingEnrollment) {
          await prisma.courseEnrollment.create({
            data: {
              id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              userId: session.user.id,
              courseId: courseWithRelations.id,
              progress: 0,
              completed: false,
              updatedAt: new Date()
            }
          })
          console.log(`✅ AUTO-ENROLLED AFFILIATE to training: ${session.user.email}`)
          affiliateAutoEnrolled = true
        }
      }
    }
    
    // MEMBER course - hanya member aktif yang bisa akses
    if (courseRoleAccess === 'MEMBER') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
        // Check membership
        const hasActiveMembership = await prisma.userMembership.findFirst({
          where: {
            userId: session.user.id,
            isActive: true,
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          }
        })
        
        if (!hasActiveMembership && !['MEMBER_PREMIUM', 'MEMBER_FREE'].includes(session.user.role)) {
          return NextResponse.json({ 
            error: 'Kelas ini hanya untuk Member Premium. Silakan upgrade membership.' 
          }, { status: 403 })
        }
      }
    }

    // Check if user has access to this course
    let hasAccess = false
    let progress = 0

    console.log('🔍 User info:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      roleType: typeof session.user.role
    })

    // 0. Admin and Mentor have full access
    if (session.user.role === 'ADMIN' || session.user.role === 'MENTOR') {
      hasAccess = true
      console.log(`✅ ${session.user.role} bypass - Full access granted to: ${session.user.email}`)
      
      // Auto-create enrollment for admin/mentor to track progress
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseWithRelations.id
        }
      })

      if (!existingEnrollment) {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId: session.user.id,
            courseId: courseWithRelations.id,
            progress: 0,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Auto-enrolled ${session.user.role}: ${session.user.email}`)
      } else {
        progress = existingEnrollment.progress || 0
      }
    }

    // 1. Check direct enrollment
    if (!hasAccess) {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseWithRelations.id
        }
      })

      if (enrollment) {
        hasAccess = true
        progress = enrollment.progress || 0
      }
    }

    // 2. Check membership access
    if (!hasAccess) {
      // Get user's active memberships
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          status: 'ACTIVE',
          endDate: {
            gte: new Date()
          }
        }
      })

      // Check if membership includes this course
      let membershipHasCourse = false
      if (userMembership) {
        const membershipCourse = await prisma.membershipCourse.findFirst({
          where: {
            membershipId: userMembership.membershipId,
            courseId: courseWithRelations.id
          }
        })
        membershipHasCourse = !!membershipCourse
      }

      if (membershipHasCourse) {
        hasAccess = true
        
        // Auto-enroll user if accessing via membership
        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            userId: session.user.id,
            courseId: courseWithRelations.id
          }
        })

        if (!existingEnrollment) {
          await prisma.courseEnrollment.create({
            data: {
              id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              userId: session.user.id,
              courseId: courseWithRelations.id,
              progress: 0,
              updatedAt: new Date()
            }
          })
        }
      }
    }

    // 3. PRD: Check membershipIncluded - kursus yang gratis untuk member aktif
    if (!hasAccess && courseWithRelations.membershipIncluded) {
      const hasActiveMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          status: 'ACTIVE',
          endDate: { gte: new Date() }
        }
      })

      if (hasActiveMembership) {
        hasAccess = true
        console.log(`✅ membershipIncluded access granted to: ${session.user.email}`)
        
        // Auto-enroll
        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            userId: session.user.id,
            courseId: courseWithRelations.id
          }
        })

        if (!existingEnrollment) {
          await prisma.courseEnrollment.create({
            data: {
              id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              userId: session.user.id,
              courseId: courseWithRelations.id,
              progress: 0,
              updatedAt: new Date()
            }
          })
        }
      }
    }

    // 4. Get user progress
    const userProgress = await prisma.userCourseProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseWithRelations.id
      }
    })

    // If user doesn't have access (and is NOT admin/mentor), filter out locked lessons
    if (!hasAccess && session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      courseWithRelations.modules = courseWithRelations.modules.map((module: any) => ({
        ...module,
        lessons: module.lessons.filter((lesson: any) => lesson.isFree)
      }))
    }

    console.log('🎯 Final result:', {
      hasAccess,
      progress,
      modulesCount: courseWithRelations.modules.length,
      lessonsCount: courseWithRelations.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0)
    })
    
    // Final validation - ensure modules and lessons exist
    if (!courseWithRelations.modules || courseWithRelations.modules.length === 0) {
      console.warn(`⚠️ [API /learn/${slug}] Course has NO modules!`)
    }

    return NextResponse.json({
      course: courseWithRelations,
      hasAccess,
      progress,
      userProgress
    })
  } catch (error) {
    console.error(`❌ [API /learn] Error fetching course:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
