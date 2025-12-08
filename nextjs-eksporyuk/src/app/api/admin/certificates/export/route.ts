import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/admin/certificates/export - Export certificates to CSV (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const isValid = searchParams.get('isValid')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (courseId) where.courseId = courseId
    if (isValid !== null && isValid !== undefined) {
      where.isValid = isValid === 'true'
    }
    if (startDate) {
      where.issuedAt = { gte: new Date(startDate) }
    }
    if (endDate) {
      where.issuedAt = { 
        ...where.issuedAt,
        lte: new Date(endDate) 
      }
    }

    // Fetch certificates
    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        course: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    })

    // Generate CSV
    const headers = [
      'Certificate Number',
      'Student Name',
      'Student Email',
      'Student Phone',
      'Course Name',
      'Completion Date',
      'Issued Date',
      'Status',
      'Verification URL',
      'PDF URL'
    ]

    const rows = certificates.map(cert => [
      cert.certificateNumber,
      cert.studentName,
      cert.user.email,
      cert.user.phone || '',
      cert.courseName,
      new Date(cert.completionDate).toLocaleDateString('id-ID'),
      new Date(cert.issuedAt).toLocaleDateString('id-ID'),
      cert.isValid ? 'Valid' : 'Revoked',
      cert.verificationUrl || '',
      cert.pdfUrl || ''
    ])

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_CERTIFICATES',
        entity: 'CERTIFICATE',
        metadata: {
          totalCertificates: certificates.length,
          filters: { courseId, isValid, startDate, endDate }
        }
      }
    })

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="certificates-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Failed to export certificates:', error)
    return NextResponse.json(
      { error: 'Failed to export certificates' },
      { status: 500 }
    )
  }
}
