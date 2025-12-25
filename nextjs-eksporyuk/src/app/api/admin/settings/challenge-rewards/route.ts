import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/settings/challenge-rewards - Get challenge reward settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          challengeRewardAutoApprove: false,
          challengeRewardAutoApproveLimit: 500000
        }
      })
    }

    return NextResponse.json({
      challengeRewardAutoApprove: settings.challengeRewardAutoApprove,
      challengeRewardAutoApproveLimit: Number(settings.challengeRewardAutoApproveLimit || 500000)
    })
  } catch (error) {
    console.error('Get challenge reward settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings/challenge-rewards - Update challenge reward settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await req.json()
    const { challengeRewardAutoApprove, challengeRewardAutoApproveLimit } = body

    // Validation
    if (typeof challengeRewardAutoApprove !== 'boolean') {
      return NextResponse.json({ 
        error: 'challengeRewardAutoApprove must be a boolean' 
      }, { status: 400 })
    }

    if (challengeRewardAutoApproveLimit !== undefined && 
        (typeof challengeRewardAutoApproveLimit !== 'number' || challengeRewardAutoApproveLimit < 0)) {
      return NextResponse.json({ 
        error: 'challengeRewardAutoApproveLimit must be a positive number' 
      }, { status: 400 })
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          challengeRewardAutoApprove,
          challengeRewardAutoApproveLimit: challengeRewardAutoApproveLimit || 500000
        }
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          challengeRewardAutoApprove,
          ...(challengeRewardAutoApproveLimit !== undefined && {
            challengeRewardAutoApproveLimit
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        challengeRewardAutoApprove: settings.challengeRewardAutoApprove,
        challengeRewardAutoApproveLimit: Number(settings.challengeRewardAutoApproveLimit || 500000)
      }
    })
  } catch (error) {
    console.error('Update challenge reward settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
