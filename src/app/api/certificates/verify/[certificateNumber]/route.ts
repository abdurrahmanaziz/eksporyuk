import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/certificates/verify/[certificateNumber] - Public endpoint to verify certificate
export async function GET(
  req: NextRequest,
  { params }: { params: { certificateNumber: string } }
) {
  try {
    const { certificateNumber } = params

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      )
    }

    // Find certificate without relations (no relations in schema)
    const certificate = await prisma.certificate.findFirst({
      where: {
        certificateNumber: certificateNumber
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'Certificate not found' 
        },
        { status: 404 }
      )
    }

    if (!certificate.isValid) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'Certificate has been revoked or is no longer valid' 
        },
        { status: 410 }
      )
    }

    // Fetch related data manually
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { id: certificate.userId },
        select: { name: true, avatar: true }
      }),
      prisma.course.findUnique({
        where: { id: certificate.courseId },
        select: { title: true, thumbnail: true, duration: true, mentorId: true }
      })
    ])

    // Get mentor name if course exists
    let mentorName = 'EksporYuk Team'
    if (course?.mentorId) {
      const mentor = await prisma.user.findUnique({
        where: { id: course.mentorId },
        select: { name: true }
      })
      if (mentor?.name) mentorName = mentor.name
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completedAt: certificate.completedAt,
        completionDate: certificate.completionDate,
        issuedAt: certificate.issuedAt,
        isValid: certificate.isValid,
        pdfUrl: certificate.pdfUrl,
        user: user ? { name: user.name, image: user.avatar } : { name: certificate.studentName, image: null },
        course: {
          title: course?.title || certificate.courseName,
          thumbnail: course?.thumbnail,
          duration: course?.duration,
          mentor: {
            user: {
              name: mentorName
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Verify certificate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
