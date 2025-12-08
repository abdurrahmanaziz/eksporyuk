import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { score, feedback } = await req.json()

    // Validate input
    if (typeof score !== 'number' || score < 0) {
      return Response.json({ error: 'Nilai harus angka positif' }, { status: 400 })
    }

    if (!feedback?.trim()) {
      return Response.json({ error: 'Feedback tidak boleh kosong' }, { status: 400 })
    }

    // Check if user is instructor/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
      return Response.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Get submission with assignment details
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: params.id },
      include: {
        assignment: {
          select: {
            maxScore: true,
            courseId: true
          }
        }
      }
    })

    if (!submission) {
      return Response.json({ error: 'Submission tidak ditemukan' }, { status: 404 })
    }

    // Validate score doesn't exceed max
    if (score > submission.assignment.maxScore) {
      return Response.json(
        { error: `Nilai tidak boleh melebihi ${submission.assignment.maxScore}` },
        { status: 400 }
      )
    }

    // Update submission with grade
    const gradedSubmission = await prisma.assignmentSubmission.update({
      where: { id: params.id },
      data: {
        score: score,
        feedback: feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedBy: session.user.id
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        assignment: {
          select: {
            title: true,
            maxScore: true
          }
        }
      }
    })

    return Response.json({
      success: true,
      submission: gradedSubmission
    })
  } catch (error) {
    console.error('Error grading submission:', error)
    return Response.json({ error: 'Gagal menyimpan nilai' }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is instructor/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
      return Response.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Get submission details
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: params.id },
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
            description: true,
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return Response.json({ error: 'Submission tidak ditemukan' }, { status: 404 })
    }

    return Response.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return Response.json({ error: 'Gagal mengambil data submission' }, { status: 500 })
  }
}
