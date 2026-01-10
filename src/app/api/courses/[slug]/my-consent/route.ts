import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/courses/[slug]/my-consent
 * Get current user's consent data for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { slug } = resolvedParams

    // Find course by slug
    const course = await prisma.course.findFirst({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Find user's consent for this course
    const consent = await prisma.courseConsent.findFirst({
      where: {
        userId: session.user.id,
        courseId: course.id
      }
    })

    if (!consent) {
      return NextResponse.json({ 
        success: false,
        error: 'Anda belum menyetujui ketentuan Hak Cipta untuk kursus ini' 
      }, { status: 404 })
    }

    // Get user data separately (no relation in schema)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        memberCode: true
      }
    })

    return NextResponse.json({
      success: true,
      consent: {
        id: consent.id,
        agreedAt: consent.agreedAt.toISOString(),
        ipAddress: consent.ipAddress,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug
        },
        user: user || {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          memberCode: null
        }
      }
    })
  } catch (error) {
    console.error('Error fetching user consent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
