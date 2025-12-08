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

// POST /api/admin/certificates/issue - Manually issue certificate (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, courseId, sendEmail = true } = body

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      )
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Certificate already exists for this user and course' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        certificateTemplate: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check or create enrollment
    let enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (!enrollment) {
      // Create enrollment automatically
      enrollment = await prisma.courseEnrollment.create({
        data: {
          userId,
          courseId,
          progress: 100,
          completed: true,
          completedAt: new Date()
        }
      })
    } else if (!enrollment.completed) {
      // Update enrollment to completed
      enrollment = await prisma.courseEnrollment.update({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        data: {
          progress: 100,
          completed: true,
          completedAt: new Date()
        }
      })
    }

    // Generate certificate number
    const certificateNum = generateCertificateNumber()

    // Get template
    let template = course.certificateTemplate
    if (!template) {
      template = await prisma.certificateTemplate.findFirst({
        where: { isDefault: true, isActive: true }
      })
    }

    // Prepare verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${certificateNum}`

    // Prepare certificate data
    const certificateData = {
      certificateNumber: certificateNum,
      studentName: user.name || 'Student',
      courseName: course.title,
      completionDate: enrollment.completedAt || new Date(),
      verificationUrl,
      instructor: 'EksporYuk',
      duration: course.duration
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificateData, template || undefined)

    // Upload PDF
    const pdfUrl = await uploadCertificatePDF(pdfBuffer, certificateNum)

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: certificateNum,
        studentName: user.name || 'Student',
        courseName: course.title,
        completedAt: enrollment.completedAt || new Date(),
        completionDate: enrollment.completedAt || new Date(),
        certificateTemplateId: template?.id,
        verificationUrl,
        pdfUrl
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true
          }
        }
      }
    })

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT',
        title: '🎓 Certificate Issued!',
        message: `Congratulations! Your certificate for "${course.title}" has been issued by admin.`,
        link: `/certificates`,
        isRead: false
      }
    })

    // Send email if requested
    if (sendEmail) {
      try {
        await sendCertificateEmail({
          email: user.email,
          name: user.name || 'Student',
          courseName: course.title,
          certificateNumber: certificateNum,
          verificationUrl,
          pdfUrl,
          completionDate: enrollment.completedAt || new Date()
        })
      } catch (emailError) {
        console.error('Failed to send certificate email:', emailError)
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'ISSUE_CERTIFICATE_MANUAL',
        entity: 'CERTIFICATE',
        entityId: certificate.id,
        metadata: {
          certificateNumber: certificateNum,
          recipientUserId: userId,
          recipientEmail: user.email,
          studentName: user.name,
          courseName: course.title,
          emailSent: sendEmail
        }
      }
    })

    return NextResponse.json({
      message: 'Certificate issued successfully',
      certificate
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to issue certificate:', error)
    return NextResponse.json(
      { error: 'Failed to issue certificate' },
      { status: 500 }
    )
  }
}
