import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get course settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get settings or create default if not exists
    let settings = await prisma.courseSettings.findFirst()

    if (!settings) {
      settings = await prisma.courseSettings.create({
        data: {
          defaultMentorCommission: 50,
          defaultAffiliateCommission: 30,
          minWithdrawalAmount: 50000,
          withdrawalProcessingDays: 3,
          maxWithdrawalPerDay: 10000000,
          withdrawalMethods: ['Bank Transfer', 'E-Wallet'],
          autoApproveCourses: false,
          autoApproveEnrollments: true,
          defaultCourseVisibility: 'PUBLIC',
          requireCertificateCompletion: true,
          certificateMinScore: 80,
          enableAffiliateProgram: true,
          enableMentorProgram: true,
          // Mentor Permissions
          mentorCanCreateGroup: true,
          mentorCanCreateCourse: true,
          mentorCanCreateMaterial: true,
          mentorCanEditOwnCourse: true,
          mentorCanDeleteOwnCourse: false,
          mentorCanViewAnalytics: true,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching course settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update course settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    // Get existing settings
    let settings = await prisma.courseSettings.findFirst()

    if (!settings) {
      // Create if not exists
      settings = await prisma.courseSettings.create({
        data: body,
      })
    } else {
      // Update existing
      settings = await prisma.courseSettings.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating course settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
