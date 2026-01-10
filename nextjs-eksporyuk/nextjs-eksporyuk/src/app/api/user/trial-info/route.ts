import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/trial-info
 * Get user's trial end date calculated from registration date
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's createdAt from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        createdAt: true,
        role: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate trial end date (3 days from registration)
    const trialEnd = new Date(user.createdAt)
    trialEnd.setDate(trialEnd.getDate() + 3)

    // Check if user has active membership
    const activeMembership = await prisma.userMembership.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      trialEndsAt: trialEnd.toISOString(),
      createdAt: user.createdAt.toISOString(),
      hasMembership: !!activeMembership,
      isTrialExpired: new Date() > trialEnd,
    })
  } catch (error) {
    console.error('Error fetching trial info:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
