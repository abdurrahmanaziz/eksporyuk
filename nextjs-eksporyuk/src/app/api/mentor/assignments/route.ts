import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get assignments from courses owned by this mentor
    const courses = await prisma.course.findMany({
      where: { mentorId: session.user.id },
      select: {
        id: true,
        title: true,
        assignments: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            maxScore: true,
            createdAt: true,
            submissions: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    })

    // Transform to assignments format
    const assignments = courses.flatMap(course => 
      course.assignments.map(assignment => {
        const pending = assignment.submissions.filter(s => s.status === 'SUBMITTED').length
        const graded = assignment.submissions.filter(s => s.status === 'GRADED').length
        const late = assignment.submissions.filter(s => s.status === 'LATE').length
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate?.toISOString() || new Date().toISOString(),
          maxScore: assignment.maxScore,
          course: { id: course.id, title: course.title },
          submissions: {
            total: assignment.submissions.length,
            pending,
            graded,
            late
          },
          status: 'ACTIVE' as const,
          createdAt: assignment.createdAt.toISOString()
        }
      })
    )

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching mentor assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
