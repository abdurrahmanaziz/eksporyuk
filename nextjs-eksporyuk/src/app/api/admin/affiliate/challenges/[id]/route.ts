import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/affiliate/challenges/[id] - Get challenge detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id },
      include: {
        membership: {
          select: { id: true, name: true, slug: true }
        },
        product: {
          select: { id: true, name: true, slug: true }
        },
        course: {
          select: { id: true, title: true, slug: true }
        },
        progress: {
          orderBy: { currentValue: 'desc' },
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Calculate stats
    const completedCount = challenge.progress.filter(p => p.completed).length
    const claimedCount = challenge.progress.filter(p => p.rewardClaimed).length
    const pendingCount = challenge.progress.filter(p => p.rewardStatus === 'PENDING').length
    const approvedCount = challenge.progress.filter(p => p.rewardStatus === 'APPROVED').length
    const rejectedCount = challenge.progress.filter(p => p.rewardStatus === 'REJECTED').length
    const totalProgressValue = challenge.progress.reduce(
      (sum, p) => sum + Number(p.currentValue),
      0
    )

    // Format participants with progress
    const participants = challenge.progress.map((p, idx) => ({
      rank: idx + 1,
      affiliateId: p.affiliateId,
      userId: p.affiliate.user.id,
      name: p.affiliate.user.name,
      email: p.affiliate.user.email,
      avatar: p.affiliate.user.avatar,
      tier: p.affiliate.tier,
      currentValue: Number(p.currentValue),
      progress: Number(challenge.targetValue) > 0 
        ? Math.min((Number(p.currentValue) / Number(challenge.targetValue)) * 100, 100)
        : 0,
      completed: p.completed,
      completedAt: p.completedAt,
      rewardClaimed: p.rewardClaimed,
      claimedAt: p.claimedAt,
      rewardStatus: p.rewardStatus,
      approvedBy: p.approvedBy,
      approvedAt: p.approvedAt,
      rejectionReason: p.rejectionReason,
      joinedAt: p.createdAt
    }))

    const now = new Date()
    const isOngoing = challenge.isActive && 
      challenge.startDate <= now && 
      challenge.endDate >= now
    const isUpcoming = challenge.startDate > now
    const hasEnded = challenge.endDate < now

    return NextResponse.json({
      challenge: {
        ...challenge,
        targetValue: Number(challenge.targetValue),
        rewardValue: Number(challenge.rewardValue),
        status: isOngoing ? 'active' : isUpcoming ? 'upcoming' : 'ended',
        progress: undefined // Remove raw progress from challenge object
      },
      stats: {
        participantsCount: challenge.progress.length,
        completedCount,
        claimedCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalProgressValue,
        averageProgress: challenge.progress.length > 0 
          ? totalProgressValue / challenge.progress.length 
          : 0,
        completionRate: challenge.progress.length > 0 
          ? ((completedCount / challenge.progress.length) * 100).toFixed(1)
          : '0.0'
      },
      participants
    })
  } catch (error) {
    console.error('Admin get challenge detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/affiliate/challenges/[id] - Update challenge
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id },
      include: {
        _count: { select: { progress: true } }
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    
    // Allow updating product relations anytime
    if (body.membershipId !== undefined) updateData.membershipId = body.membershipId || null
    if (body.productId !== undefined) updateData.productId = body.productId || null
    if (body.courseId !== undefined) updateData.courseId = body.courseId || null

    // Only allow updating target/reward if no participants yet
    if (challenge._count.progress === 0) {
      if (body.targetType !== undefined) updateData.targetType = body.targetType
      if (body.targetValue !== undefined) updateData.targetValue = parseFloat(body.targetValue)
      if (body.rewardType !== undefined) updateData.rewardType = body.rewardType
      if (body.rewardValue !== undefined) updateData.rewardValue = parseFloat(body.rewardValue)
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
      if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    } else if (
      body.targetType !== undefined || 
      body.targetValue !== undefined || 
      body.rewardType !== undefined || 
      body.rewardValue !== undefined
    ) {
      return NextResponse.json(
        { error: 'Cannot modify target/reward values after participants have joined' },
        { status: 400 }
      )
    }

    // Validate dates if both are being updated
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate <= updateData.startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const updatedChallenge = await prisma.affiliateChallenge.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Challenge updated successfully',
      challenge: {
        ...updatedChallenge,
        targetValue: Number(updatedChallenge.targetValue),
        rewardValue: Number(updatedChallenge.rewardValue)
      }
    })
  } catch (error) {
    console.error('Update challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/affiliate/challenges/[id] - Delete challenge
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id },
      include: {
        progress: {
          where: { completed: true }
        }
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Prevent deletion if there are completed participants
    if (challenge.progress.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete challenge with completed participants. Deactivate it instead.' },
        { status: 400 }
      )
    }

    // Delete all progress records first, then the challenge
    await prisma.$transaction([
      prisma.affiliateChallengeProgress.deleteMany({
        where: { challengeId: id }
      }),
      prisma.affiliateChallenge.delete({
        where: { id }
      })
    ])

    return NextResponse.json({
      message: 'Challenge deleted successfully'
    })
  } catch (error) {
    console.error('Delete challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    )
  }
}
