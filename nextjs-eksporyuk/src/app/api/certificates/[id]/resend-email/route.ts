import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendCertificateEmail } from '@/lib/email/certificate-email'

/**
 * POST /api/certificates/[id]/resend-email
 * Resend certificate email (Admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check admin permission
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get certificate with user and course data
    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { message: 'Certificate not found' },
        { status: 404 }
      )
    }

    if (!certificate.isValid) {
      return NextResponse.json(
        { message: 'Cannot send email for revoked certificate' },
        { status: 400 }
      )
    }

    // Send certificate email
    const sent = await sendCertificateEmail({
      email: certificate.user.email,
      name: certificate.user.name || 'Student',
      courseName: certificate.course.title,
      certificateNumber: certificate.certificateNumber,
      verificationUrl: certificate.verificationUrl || `/verify/${certificate.certificateNumber}`,
      pdfUrl: certificate.pdfUrl || '',
      completionDate: certificate.completionDate
    })

    if (!sent) {
      return NextResponse.json(
        { message: 'Failed to send email. Please check Mailketing configuration.' },
        { status: 500 }
      )
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'RESEND_CERTIFICATE_EMAIL',
        metadata: {
          entityType: 'CERTIFICATE',
          entityId: certificate.id,
          certificateNumber: certificate.certificateNumber,
          recipientEmail: certificate.user.email,
          recipientName: certificate.user.name,
          courseName: certificate.course.title
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Certificate email sent to ${certificate.user.email}`
    })

  } catch (error) {
    console.error('Resend certificate email error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
