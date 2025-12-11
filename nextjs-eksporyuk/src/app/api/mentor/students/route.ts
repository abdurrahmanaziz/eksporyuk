import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is mentor or admin
    if (session.user.role !== 'MENTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Mentor access required' },
        { status: 403 }
      )
    }

    // Get all students enrolled in mentor's courses
    const students = await prisma.userCourseProgress.findMany({
      where: {
        course: {
          mentorId: session.user.id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      }
    })

    // Get quiz attempts count for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const quizAttempts = await prisma.quizAttempt.count({
          where: {
            userId: student.userId,
            quiz: {
              lesson: {
                module: {
                  courseId: student.courseId
                }
              }
            }
          }
        })

        const assignmentSubmissions = await prisma.assignmentSubmission.count({
          where: {
            userId: student.userId,
            assignment: {
              lesson: {
                module: {
                  courseId: student.courseId
                }
              }
            }
          }
        })

        return {
          ...student,
          quizAttempts,
          assignmentSubmissions
        }
      })
    )

    return NextResponse.json({
      students: studentsWithStats
    })

  } catch (error) {
    console.error('Failed to fetch mentor students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
