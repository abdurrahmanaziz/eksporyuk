import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const courseId = url.searchParams.get('courseId')
    const assignmentId = url.searchParams.get('assignmentId')
    const status = url.searchParams.get('status') // SUBMITTED, GRADED
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Check if user is instructor/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
      return Response.json({ error: 'Akses ditolak. Hanya instruktur yang bisa akses.' }, { status: 403 })
    }

    // Build where clause
    const whereClause: any = {}

    if (courseId) {
      whereClause.assignment = {
        courseId: courseId
      }
    }

    if (assignmentId) {
      whereClause.assignmentId = assignmentId
    }

    if (status) {
      whereClause.status = status
    }

    // Get submissions count
    const total = await prisma.assignmentSubmission.count({
      where: whereClause
    })

    // Get submissions with related data
    const submissions = await prisma.assignmentSubmission.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            dueDate: true,
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    return Response.json({
      submissions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return Response.json({ error: 'Gagal mengambil data submission' }, { status: 500 })
  }
}
