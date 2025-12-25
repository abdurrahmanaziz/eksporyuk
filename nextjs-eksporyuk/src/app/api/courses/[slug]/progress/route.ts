import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/courses/[slug]/progress - Update lesson progress
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courseSlug = params.slug
    const { lessonId, completed } = await request.json()

    // Find course
    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
      select: {
        id: true,
        title: true,
        slug: true,
        isAffiliateTraining: true,
        affiliateOnly: true,
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: course.id
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      )
    }

    // Get or create user progress
    let userProgress = await prisma.userCourseProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: course.id
      }
    })

    if (!userProgress) {
      userProgress = await prisma.userCourseProgress.create({
        data: {
          userId: session.user.id,
          courseId: course.id,
          progress: 0,
          completedLessons: JSON.stringify([]),
          hasAccess: true
        }
      })
    }

    // Parse completed lessons
    let completedLessons: string[] = []
    try {
      completedLessons = JSON.parse(userProgress.completedLessons as string || '[]')
    } catch (e) {
      completedLessons = []
    }

    // Update completed lessons
    if (completed && !completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    } else if (!completed && completedLessons.includes(lessonId)) {
      completedLessons = completedLessons.filter(id => id !== lessonId)
    }

    // Calculate progress percentage
    const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0)
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons.length / totalLessons) * 100)
      : 0

    const isCompleted = progressPercentage === 100

    // Update progress
    userProgress = await prisma.userCourseProgress.update({
      where: { id: userProgress.id },
      data: {
        completedLessons: JSON.stringify(completedLessons),
        progress: progressPercentage,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date()
      }
    })

    // Update enrollment
    await prisma.courseEnrollment.updateMany({
      where: {
        userId: session.user.id,
        courseId: course.id
      },
      data: {
        progress: progressPercentage,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    })

    // Track training completion for response
    let trainingJustCompleted = false

    // TODO: Generate certificate if course completed
    if (isCompleted) {
      const existingCertificate = await prisma.certificate.findFirst({
        where: {
          userId: session.user.id,
          courseId: course.id
        }
      })

      if (!existingCertificate) {
        await prisma.certificate.create({
          data: {
            userId: session.user.id,
            courseId: course.id,
            issuedAt: new Date(),
            certificateNumber: `CERT-${course.slug.toUpperCase()}-${session.user.id.substring(0, 8).toUpperCase()}-${Date.now()}`
          }
        })
      }

      // Check if this is an affiliate training course and mark training as completed
      const isAffiliateTraining = course.isAffiliateTraining || course.affiliateOnly
      
      console.log(`🔍 Checking training completion for course: ${course.title}`)
      console.log(`   isAffiliateTraining: ${course.isAffiliateTraining}`)
      console.log(`   affiliateOnly: ${course.affiliateOnly}`)
      console.log(`   isCompleted: ${isCompleted}`)
      console.log(`   Combined check: ${isAffiliateTraining && isCompleted}`)
      
      if (isAffiliateTraining && isCompleted) {
        // Check if user is affiliate
        const affiliateProfile = await prisma.affiliateProfile.findUnique({
          where: { userId: session.user.id },
          select: { 
            id: true, 
            trainingCompleted: true
          }
        })

        console.log(`   Affiliate profile found: ${!!affiliateProfile}`)
        console.log(`   Current training completed: ${affiliateProfile?.trainingCompleted}`)

        if (affiliateProfile && !affiliateProfile.trainingCompleted) {
          // Mark training as completed
          // @ts-ignore - new fields may not be in cached types
          await (prisma.affiliateProfile.update as any)({
            where: { id: affiliateProfile.id },
            data: {
              trainingCompleted: true,
              trainingCompletedAt: new Date()
            }
          })

          trainingJustCompleted = true
          console.log(`✅ Training completed for affiliate ${session.user.id} - Course: ${course.title}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      progress: progressPercentage,
      completedLessons,
      isCompleted,
      trainingCompleted: trainingJustCompleted,
      shouldRedirectToOnboarding: trainingJustCompleted
    })
  } catch (error) {
    console.error('POST /api/courses/[slug]/progress error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
