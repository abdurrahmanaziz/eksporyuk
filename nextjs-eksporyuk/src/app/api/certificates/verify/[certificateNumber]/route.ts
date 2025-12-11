import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
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

    const certificate = await prisma.certificate.findUnique({
      where: {
        certificateNumber
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
        course: {
          select: {
            title: true,
            thumbnail: true,
            duration: true,
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
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
        issuedAt: certificate.issuedAt,
        instructor: certificate.course.mentor?.user.name || 'EksporYuk',
        duration: certificate.course.duration
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
