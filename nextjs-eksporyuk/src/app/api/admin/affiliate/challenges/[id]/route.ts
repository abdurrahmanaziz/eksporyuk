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

    // AffiliateChallenge has no relations - query separately
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get related data separately
    const [membership, product, course, progressData] = await Promise.all([
      challenge.membershipId 
        ? prisma.membership.findUnique({
            where: { id: challenge.membershipId },
            select: { id: true, name: true, slug: true }
          })
        : null,
      challenge.productId
        ? prisma.product.findUnique({
            where: { id: challenge.productId },
            select: { id: true, name: true, slug: true }
          })
        : null,
      challenge.courseId
        ? prisma.course.findUnique({
            where: { id: challenge.courseId },
            select: { id: true, title: true, slug: true }
          })
        : null,
      // AffiliateChallengeProgress has no relations - query separately  
      prisma.affiliateChallengeProgress.findMany({
        where: { challengeId: id },
        orderBy: { currentValue: 'desc' }
      })
    ])

    // Get affiliate data for progress
    const affiliateIds = [...new Set(progressData.map(p => p.affiliateId))]
    const affiliates = affiliateIds.length > 0 
      ? await prisma.affiliate.findMany({
          where: { id: { in: affiliateIds } }
        })
      : []
    const affiliateMap = new Map(affiliates.map(a => [a.id, a]))

    // Get user data for affiliates
    const userIds = [...new Set(affiliates.map(a => a.userId))]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, avatar: true }
        })
      : []
    const userMap = new Map(users.map(u => [u.id, u]))

    // Calculate stats
    const completedCount = progressData.filter(p => p.completed).length
    const claimedCount = progressData.filter(p => p.rewardClaimed).length
    const pendingCount = progressData.filter(p => p.rewardStatus === 'PENDING').length
    const approvedCount = progressData.filter(p => p.rewardStatus === 'APPROVED').length
    const rejectedCount = progressData.filter(p => p.rewardStatus === 'REJECTED').length
    const totalProgressValue = progressData.reduce(
      (sum, p) => sum + Number(p.currentValue),
      0
    )

    // Format participants with progress
    const participants = progressData.map((p, idx) => {
      const affiliate = affiliateMap.get(p.affiliateId)
      const affiliateUser = affiliate ? userMap.get(affiliate.userId) : null
      
      return {
        rank: idx + 1,
        affiliateId: p.affiliateId,
        userId: affiliateUser?.id || '',
        name: affiliateUser?.name || 'Unknown',
        email: affiliateUser?.email || '',
        avatar: affiliateUser?.avatar || null,
        tier: affiliate?.tier || 'BRONZE',
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
      }
    })

    const now = new Date()
    const isOngoing = challenge.isActive && 
      challenge.startDate <= now && 
      challenge.endDate >= now
    const isUpcoming = challenge.startDate > now

    return NextResponse.json({
      challenge: {
        ...challenge,
        membership,
        product,
        course,
        targetValue: Number(challenge.targetValue),
        rewardValue: Number(challenge.rewardValue),
        status: isOngoing ? 'active' : isUpcoming ? 'upcoming' : 'ended'
      },
      stats: {
        participantsCount: progressData.length,
        completedCount,
        claimedCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalProgressValue,
        averageProgress: progressData.length > 0 
          ? totalProgressValue / progressData.length 
          : 0,
        completionRate: progressData.length > 0 
          ? ((completedCount / progressData.length) * 100).toFixed(1)
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

    // AffiliateChallenge has no relations - query separately
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Count progress records separately
    const progressCount = await prisma.affiliateChallengeProgress.count({
      where: { challengeId: id }
    })

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
    if (progressCount === 0) {
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

    // AffiliateChallenge requires manual updatedAt
    updateData.updatedAt = new Date()

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

    // AffiliateChallenge has no relations - query separately
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Check for completed participants separately
    const completedProgress = await prisma.affiliateChallengeProgress.findMany({
      where: { 
        challengeId: id,
        completed: true 
      }
    })

    // Prevent deletion if there are completed participants
    if (completedProgress.length > 0) {
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
