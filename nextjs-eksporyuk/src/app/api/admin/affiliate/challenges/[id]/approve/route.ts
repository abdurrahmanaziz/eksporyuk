import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/affiliate/challenges/[id]/approve - Approve reward claim
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id: progressId } = await params
    const body = await req.json()
    const { action, rejectionReason } = body // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }

    // Get progress - AffiliateChallengeProgress has no relations
    const progress = await prisma.affiliateChallengeProgress.findUnique({
      where: { id: progressId }
    })

    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 })
    }

    // Get challenge and affiliate data separately
    const [challenge, affiliate] = await Promise.all([
      prisma.affiliateChallenge.findUnique({
        where: { id: progress.challengeId }
      }),
      prisma.affiliate.findUnique({
        where: { id: progress.affiliateId }
      })
    ])

    if (!challenge || !affiliate) {
      return NextResponse.json({ error: 'Challenge or affiliate not found' }, { status: 404 })
    }

    // Get user data for affiliate
    const affiliateUser = await prisma.user.findUnique({
      where: { id: affiliate.userId },
      select: { id: true, name: true, email: true }
    })

    if (!progress.completed) {
      return NextResponse.json({ error: 'Challenge not completed' }, { status: 400 })
    }

    if (progress.rewardStatus !== 'PENDING') {
      return NextResponse.json({ 
        error: `Cannot process. Current status: ${progress.rewardStatus}` 
      }, { status: 400 })
    }

    // REJECT
    if (action === 'reject') {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
      }

      await prisma.affiliateChallengeProgress.update({
        where: { id: progressId },
        data: {
          rewardStatus: 'REJECTED',
          approvedBy: session.user.id,
          approvedAt: new Date(),
          rejectionReason: rejectionReason.trim(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Reward claim rejected',
        status: 'REJECTED'
      })
    }

    // APPROVE - Process reward
    const rewardValue = Number(challenge.rewardValue)

    if (challenge.rewardType === 'BONUS_COMMISSION') {
      // Add to affiliate wallet
      await prisma.$transaction(async (tx) => {
        // Update wallet
        await tx.wallet.upsert({
          where: { userId: affiliate.userId },
          create: {
            userId: affiliate.userId,
            balance: rewardValue,
            totalEarnings: rewardValue
          },
          update: {
            balance: { increment: rewardValue },
            totalEarnings: { increment: rewardValue }
          }
        })

        // Get wallet for transaction
        const wallet = await tx.wallet.findUnique({
          where: { userId: affiliate.userId }
        })

        if (!wallet) {
          throw new Error('Wallet not found after upsert')
        }

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: rewardValue,
            type: 'CHALLENGE_REWARD',
            description: `Reward dari challenge: ${challenge.title} (Approved by admin)`
          }
        })

        // Update affiliate total earnings
        await tx.affiliateProfile.update({
          where: { id: affiliate.id },
          data: {
            totalEarnings: { increment: rewardValue }
          }
        })

        // Mark reward as approved and claimed
        await tx.affiliateChallengeProgress.update({
          where: { id: progressId },
          data: {
            rewardStatus: 'APPROVED',
            rewardClaimed: true,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        })
      })
    } else if (challenge.rewardType === 'TIER_UPGRADE') {
      // Upgrade affiliate tier
      await prisma.$transaction(async (tx) => {
        const currentTier = affiliate.tier
        const newTier = Math.min(currentTier + Number(rewardValue), 5) // Max tier 5

        await tx.affiliateProfile.update({
          where: { id: affiliate.id },
          data: { tier: newTier }
        })

        await tx.affiliateChallengeProgress.update({
          where: { id: progressId },
          data: {
            rewardStatus: 'APPROVED',
            rewardClaimed: true,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        })
      })
    } else {
      // Generic reward - just mark as approved
      await prisma.affiliateChallengeProgress.update({
        where: { id: progressId },
        data: {
          rewardStatus: 'APPROVED',
          rewardClaimed: true,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reward claim approved and processed',
      status: 'APPROVED',
      rewardType: challenge.rewardType,
      rewardValue,
      affiliateName: affiliateUser?.name || 'Unknown'
    })
  } catch (error) {
    console.error('Approve/reject reward error:', error)
    return NextResponse.json(
      { error: 'Failed to process reward claim' },
      { status: 500 }
    )
  }
}
