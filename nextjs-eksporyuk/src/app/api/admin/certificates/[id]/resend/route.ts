import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendCertificateEmail } from '@/lib/email/certificate-email'

// POST /api/admin/certificates/[id]/resend - Resend certificate email (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const certificateId = params.id

    // Get certificate with user info
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: true,
        course: true
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    if (!certificate.pdfUrl) {
      return NextResponse.json(
        { error: 'Certificate PDF not generated yet' },
        { status: 400 }
      )
    }

    // Send certificate email
    await sendCertificateEmail({
      email: certificate.user.email,
      name: certificate.user.name || 'Student',
      courseName: certificate.courseName,
      certificateNumber: certificate.certificateNumber,
      verificationUrl: certificate.verificationUrl || `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificate.certificateNumber}`,
      pdfUrl: certificate.pdfUrl,
      completionDate: certificate.completionDate
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: certificate.userId,
        type: 'ACHIEVEMENT',
        title: '📧 Certificate Email Resent',
        message: `Your certificate for "${certificate.courseName}" has been sent to your email.`,
        link: `/certificates`,
        isRead: false
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'RESEND_CERTIFICATE_EMAIL',
        metadata: {
          certificateId,
          certificateNumber: certificate.certificateNumber,
          recipientEmail: certificate.user.email,
          studentName: certificate.studentName,
          courseName: certificate.courseName
        }
      }
    })

    return NextResponse.json({
      message: 'Certificate email resent successfully',
      sentTo: certificate.user.email
    })

  } catch (error) {
    console.error('Failed to resend certificate email:', error)
    return NextResponse.json(
      { error: 'Failed to resend certificate email' },
      { status: 500 }
    )
  }
}
