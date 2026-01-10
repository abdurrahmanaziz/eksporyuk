import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToStream, Document } from '@react-pdf/renderer'
import { CertificateTemplate } from '@/lib/certificate-template'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const certificateId = params.id

    // Fetch certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Check authorization (student can only view their own, admin can view all)
    if (session.user.role !== 'ADMIN' && certificate.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if certificate is valid
    if (!certificate.isValid) {
      return NextResponse.json(
        { error: 'This certificate has been revoked' },
        { status: 410 }
      )
    }

    // Format completion date
    const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/certificates/verify/${certificate.certificateNumber}`

    // Generate PDF stream
    const pdfStream = await renderToStream(
      React.createElement(Document, {},
        React.createElement(CertificateTemplate, {
          studentName: certificate.studentName,
          courseName: certificate.courseName,
          completionDate: completionDate,
          certificateNumber: certificate.certificateNumber,
          verificationUrl: verificationUrl,
        })
      )
    )

    // Return PDF as download
    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
      },
    })
    
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}
