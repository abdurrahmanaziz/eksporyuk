import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

    // Check if user has appropriate role
    const allowedRoles = ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Access denied. Affiliate access required.' },
        { status: 403 }
      )
    }

    // Get or create affiliate profile for role testing
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { 
        id: true, 
        trainingCompleted: true 
      }
    })

    // For non-AFFILIATE roles, create a temporary profile if needed (for testing)
    if (!affiliateProfile && session.user.role !== 'AFFILIATE') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true }
      })

      if (user) {
        affiliateProfile = await prisma.affiliateProfile.create({
          data: {
            userId: session.user.id,
            affiliateCode: `${session.user.role}-${Date.now()}`,
            totalClicks: 0,
            totalConversions: 0,
            totalEarnings: 0
          },
          select: {
            id: true,
            trainingCompleted: true
          }
        })
      }
    }

    if (!affiliateProfile) {
      return NextResponse.json(
        { error: 'Unable to create or find affiliate profile' },
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