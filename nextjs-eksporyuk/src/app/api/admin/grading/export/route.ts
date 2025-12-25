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
    const format = url.searchParams.get('format') || 'json' // json or csv

    // Check if user is instructor/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
      return Response.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    if (!courseId) {
      return Response.json({ error: 'courseId diperlukan' }, { status: 400 })
    }

    // Get all graded submissions for the course
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          courseId: courseId
        },
        status: 'GRADED'
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
      },
      orderBy: [
        { student: { name: 'asc' } },
        { assignment: { title: 'asc' } }
      ]
    })

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Nama Siswa,Email,Tugas,Nilai,Nilai Maksimal,Persentase\n'
      
      submissions.forEach((sub: any) => {
        const percentage = ((sub.score / sub.assignment.maxScore) * 100).toFixed(2)
        csv += `"${sub.student.name}","${sub.student.email}","${sub.assignment.title}",${sub.score},${sub.assignment.maxScore},${percentage}%\n`
      })

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="grades-${courseId}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // JSON format
    return Response.json({
      courseId,
      exportedAt: new Date().toISOString(),
      totalSubmissions: submissions.length,
      submissions: submissions.map((sub: any) => ({
        studentName: sub.student.name,
        studentEmail: sub.student.email,
        assignment: sub.assignment.title,
        score: sub.score,
        maxScore: sub.assignment.maxScore,
        percentage: ((sub.score / sub.assignment.maxScore) * 100).toFixed(2)
      }))
    })
  } catch (error) {
    console.error('Error exporting grades:', error)
    return Response.json({ error: 'Gagal mengekspor nilai' }, { status: 500 })
  }
}
