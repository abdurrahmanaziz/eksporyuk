import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Certificate model has no relations in schema - fetch manually
    const certificate = await prisma.certificate.findUnique({
      where: { id }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Only allow access to own certificate or admin
    if (certificate.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch related data manually
    const [course, user, template] = await Promise.all([
      prisma.course.findUnique({
        where: { id: certificate.courseId },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true
        }
      }),
      prisma.user.findUnique({
        where: { id: certificate.userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      }),
      certificate.certificateTemplateId 
        ? prisma.certificateTemplate.findUnique({
            where: { id: certificate.certificateTemplateId }
          })
        : null
    ])

    // Combine data
    const certificateWithData = {
      ...certificate,
      course: course || { id: certificate.courseId, title: certificate.courseName, slug: null, thumbnail: null },
      user: user || { id: certificate.userId, name: certificate.studentName, email: '' },
      certificateTemplate: template
    }

    return NextResponse.json({ certificate: certificateWithData })

  } catch (error) {
    console.error('Error fetching certificate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
      { status: 500 }
    )
  }
}
