import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// POST /api/courses/[slug]/enroll-free - Free enrollment untuk affiliate training
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get course
    // @ts-ignore - Prisma types cache issue, fields exist in schema
    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        affiliateOnly: true,
        isAffiliateTraining: true,
        // @ts-ignore
        isAffiliateMaterial: true,
        monetizationType: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if course is actually free or for affiliates
    const isFreeForUser = 
      course.monetizationType === 'FREE' ||
      (course.affiliateOnly && session.user.role === 'AFFILIATE') ||
      (course.isAffiliateTraining && session.user.role === 'AFFILIATE') ||
      // @ts-ignore
      (course.isAffiliateMaterial && session.user.role === 'AFFILIATE')

    if (!isFreeForUser) {
      return NextResponse.json(
        { error: 'Course ini memerlukan pembayaran' },
        { status: 403 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        message: 'Anda sudah terdaftar di course ini',
        enrollment: existingEnrollment
      })
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        progress: 0
      }
    })

    // Update enrollment count
    await prisma.course.update({
      where: { id: course.id },
      data: { enrollmentCount: { increment: 1 } }
    })

    // Create user progress
    await prisma.userCourseProgress.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        progress: 0,
        hasAccess: true,
        accessGrantedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil mendaftar di ${course.title}`,
      enrollment
    })
  } catch (error) {
    console.error('Error enrolling:', error)
    return NextResponse.json(
      { error: 'Gagal mendaftar course' },
      { status: 500 }
    )
  }
}
