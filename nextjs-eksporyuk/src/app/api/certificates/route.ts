import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { 
  generateCertificatePDF, 
  uploadCertificatePDF,
  generateCertificateNumber 
} from '@/lib/certificate-generator'
import { sendCertificateEmail } from '@/lib/email/certificate-email'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/certificates - Get user's certificates (or all for admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId')

    // Build where clause based on role
    const where: any = {
      isValid: true
    }

    if (session.user.role === 'ADMIN') {
      // Admin can filter by userId or see all
      if (userId) where.userId = userId
      if (courseId) where.courseId = courseId
    } else {
      // Regular users only see their own
      where.userId = session.user.id
      if (courseId) where.courseId = courseId
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            mentor: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    })

    return NextResponse.json({ 
      certificates,
      total: certificates.length 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/certificates - Generate certificate (auto-called when course completed)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { message: 'courseId required' },
        { status: 400 }
      )
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ certificate: existing })
    }

    // Verify course completion via enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      },
      include: {
        course: {
          include: {
            certificateTemplate: true
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { message: 'Not enrolled in this course' },
        { status: 404 }
      )
    }

    if (!enrollment.completed || enrollment.progress < 100) {
      return NextResponse.json(
        { message: 'Course not completed', progress: enrollment.progress },
        { status: 400 }
      )
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Generate certificate number
    const certificateNum = generateCertificateNumber()

    // Get template from course or use default
    let template = enrollment.course.certificateTemplate
    if (!template) {
      template = await prisma.certificateTemplate.findFirst({
        where: { isDefault: true, isActive: true }
      })
    }

    // Prepare verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${certificateNum}`

    // Prepare certificate data for PDF generation
    const certificateData = {
      certificateNumber: certificateNum,
      studentName: user.name || 'Student',
      courseName: enrollment.course.title,
      completionDate: enrollment.completedAt || new Date(),
      verificationUrl,
      instructor: 'EksporYuk', // TODO: Get from course mentor
      duration: enrollment.course.duration
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificateData, template || undefined)

    // Upload PDF
    const pdfUrl = await uploadCertificatePDF(pdfBuffer, certificateNum)

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId: session.user.id,
        courseId,
        certificateNumber: certificateNum,
        studentName: user.name || 'Student',
        courseName: enrollment.course.title,
        completedAt: enrollment.completedAt || new Date(),
        completionDate: enrollment.completedAt || new Date(),
        certificateTemplateId: template?.id,
        verificationUrl,
        pdfUrl
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true
          }
        },
        certificateTemplate: true
      }
    })

    // Send notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'ACHIEVEMENT',
        title: '🎓 Certificate Available!',
        message: `Congratulations! Your certificate for "${enrollment.course.title}" is ready to download.`,
        link: `/certificates`,
        isRead: false
      }
    })

    // Send certificate via email
    try {
      await sendCertificateEmail({
        email: user.email,
        name: user.name || 'Student',
        courseName: enrollment.course.title,
        certificateNumber: certificateNum,
        verificationUrl,
        pdfUrl,
        completionDate: enrollment.completedAt || new Date()
      })
      console.log(`Certificate email sent to ${user.email}`)
    } catch (emailError) {
      console.error('Failed to send certificate email:', emailError)
      // Don't fail certificate generation if email fails
    }

    return NextResponse.json({ 
      certificate,
      message: 'Certificate issued successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
