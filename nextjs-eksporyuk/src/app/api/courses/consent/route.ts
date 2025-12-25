import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/courses/consent
 * Submit course consent agreement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, consentText } = body

    if (!courseId || !consentText) {
      return NextResponse.json(
        { error: 'courseId dan consentText wajib diisi' },
        { status: 400 }
      )
    }

    // Get IP address and user agent
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if consent already exists
    const existingConsent = await prisma.courseConsent.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    })

    if (existingConsent) {
      return NextResponse.json({
        success: true,
        message: 'Consent sudah tercatat sebelumnya',
        consent: existingConsent
      })
    }

    // Create new consent record
    const consent = await prisma.courseConsent.create({
      data: {
        userId: session.user.id,
        courseId,
        consentText,
        ipAddress,
        userAgent
      }
    })

    // Fetch user and course info separately (no relations in schema)
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true }
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Persetujuan berhasil disimpan',
      consent: {
        ...consent,
        user,
        course
      }
    })
  } catch (error) {
    console.error('Error creating consent:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan persetujuan' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/courses/consent?courseId=xxx
 * Check if user has consented to a course
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId parameter required' },
        { status: 400 }
      )
    }

    const consent = await prisma.courseConsent.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    })

    return NextResponse.json({
      success: true,
      hasConsented: !!consent,
      consent
    })
  } catch (error) {
    console.error('Error checking consent:', error)
    return NextResponse.json(
      { error: 'Gagal mengecek persetujuan' },
      { status: 500 }
    )
  }
}
