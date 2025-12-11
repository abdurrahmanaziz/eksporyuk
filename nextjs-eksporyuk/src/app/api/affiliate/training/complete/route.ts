import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/affiliate/training/complete
 * Mark affiliate training as completed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if user is affiliate
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { 
        id: true, 
        trainingCompleted: true 
      }
    })

    if (!affiliateProfile) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      )
    }

    // Check if course is an affiliate training course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        id: true,
        title: true,
        isAffiliateTraining: true,
        affiliateOnly: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (!course.isAffiliateTraining && !course.affiliateOnly) {
      return NextResponse.json(
        { error: 'Course is not an affiliate training course' },
        { status: 400 }
      )
    }

    // Mark training as completed if not already completed
    if (!affiliateProfile.trainingCompleted) {
      await prisma.affiliateProfile.update({
        where: { id: affiliateProfile.id },
        data: {
          trainingCompleted: true,
          trainingCompletedAt: new Date()
        }
      })

      console.log(`✅ Training manually completed for affiliate ${session.user.id} - Course: ${course.title}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Training marked as completed',
      trainingCompleted: true
    })

  } catch (error) {
    console.error('Training completion error:', error)
    return NextResponse.json(
      { error: 'Failed to mark training as completed' },
      { status: 500 }
    )
  }
}