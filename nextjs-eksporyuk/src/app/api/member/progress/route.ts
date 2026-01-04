import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's course progress data
    const userProgress = await prisma.userCourseProgress.findMany({
      where: { 
        userId,
        hasAccess: true
      },
      orderBy: {
        lastAccessedAt: 'desc'
      }
    })

    // Get course details for each progress record
    const courses = await Promise.all(userProgress.map(async (progress) => {
      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: progress.courseId },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true
        }
      })

      if (!course) return null

      // Get modules count
      const modulesCount = await prisma.courseModule.count({
        where: { courseId: course.id }
      })

      // Get lessons count  
      const lessonsCount = await prisma.courseLesson.count({
        where: {
          moduleId: {
            in: await prisma.courseModule.findMany({
              where: { courseId: course.id },
              select: { id: true }
            }).then(modules => modules.map(m => m.id))
          }
        }
      })

      // Parse completed lessons from JSON
      const completedLessonsData = progress.completedLessons as any
      const completedLessonsCount = Array.isArray(completedLessonsData) ? completedLessonsData.length : 0

      // Calculate current module (estimate based on progress)
      const currentModule = Math.min(Math.ceil((completedLessonsCount / lessonsCount) * modulesCount) || 1, modulesCount)

      // Determine status
      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
      if (progress.isCompleted) {
        status = 'COMPLETED'
      } else if (completedLessonsCount > 0 || progress.progress > 0) {
        status = 'IN_PROGRESS'
      } else {
        status = 'NOT_STARTED'
      }

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        progress: progress.progress,
        totalLessons: lessonsCount,
        completedLessons: completedLessonsCount,
        totalModules: modulesCount,
        currentModule,
        status,
        lastAccessedAt: progress.lastAccessedAt,
        enrolledAt: progress.createdAt,
        completedAt: progress.completedAt,
        timeSpent: 0 // We don't have time tracking in current schema
      }
    }))

    // Filter out null entries
    const validCourses = courses.filter(course => course !== null)

    // Filter out null entries
    const validCourses = courses.filter(course => course !== null)

    // Calculate overall statistics
    const stats = {
      totalCourses: validCourses.length,
      completedCourses: validCourses.filter(c => c.status === 'COMPLETED').length,
      inProgressCourses: validCourses.filter(c => c.status === 'IN_PROGRESS').length,
      totalLessons: validCourses.reduce((sum, c) => sum + c.totalLessons, 0),
      completedLessons: validCourses.reduce((sum, c) => sum + c.completedLessons, 0),
      totalTimeSpent: validCourses.reduce((sum, c) => sum + c.timeSpent, 0),
      averageProgress: validCourses.length > 0 
        ? validCourses.reduce((sum, c) => sum + c.progress, 0) / validCourses.length 
        : 0,
      streakDays: await calculateLearningStreak(userId),
      certificatesEarned: validCourses.filter(c => c.status === 'COMPLETED').length
    }

    return NextResponse.json({
      courses: validCourses,
      stats
    })

  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress data' }, 
      { status: 500 }
    )
  }
}

// Helper function to calculate learning streak
async function calculateLearningStreak(userId: string): Promise<number> {
  try {
    // Get last 30 days of activity
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activities = await prisma.userCourseProgress.findMany({
      where: {
        userId,
        lastAccessedAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        lastAccessedAt: true
      },
      orderBy: {
        lastAccessedAt: 'desc'
      }
    })

    if (activities.length === 0) return 0

    // Group by date and count consecutive days
    const activityDates = new Set(
      activities
        .map(a => new Date(a.lastAccessedAt).toDateString())
    )

    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      
      if (activityDates.has(checkDate.toDateString())) {
        streak++
      } else if (i > 0) {
        // If we miss a day (except today), break the streak
        break
      }
    }

    return streak

  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}