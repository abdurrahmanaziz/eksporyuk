import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { generateCertificatePDF, uploadCertificatePDF } from '@/lib/certificate-generator'

// PATCH /api/admin/certificates/[id]/regenerate - Regenerate certificate PDF (admin only)
export async function PATCH(
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

    // Get certificate with relations
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: true,
        course: true,
        certificateTemplate: true
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Get template (from certificate or default)
    let template = certificate.certificateTemplate
    if (!template) {
      template = await prisma.certificateTemplate.findFirst({
        where: { isDefault: true, isActive: true }
      })
    }

    // Prepare certificate data
    const certificateData = {
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      completionDate: certificate.completionDate,
      verificationUrl: certificate.verificationUrl || `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificate.certificateNumber}`,
      instructor: 'EksporYuk',
      duration: certificate.course.duration
    }

    // Generate new PDF
    const pdfBuffer = await generateCertificatePDF(certificateData, template || undefined)

    // Upload new PDF (overwrites old one with same certificate number)
    const pdfUrl = await uploadCertificatePDF(pdfBuffer, certificate.certificateNumber)

    // Update certificate with new PDF URL
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'REGENERATE_CERTIFICATE',
        entity: 'CERTIFICATE',
        entityId: certificateId,
        metadata: {
          certificateNumber: certificate.certificateNumber,
          studentName: certificate.studentName,
          courseName: certificate.courseName
        }
      }
    })

    return NextResponse.json({
      message: 'Certificate PDF regenerated successfully',
      certificate: updatedCertificate
    })

  } catch (error) {
    console.error('Failed to regenerate certificate:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate certificate PDF' },
      { status: 500 }
    )
  }
}
