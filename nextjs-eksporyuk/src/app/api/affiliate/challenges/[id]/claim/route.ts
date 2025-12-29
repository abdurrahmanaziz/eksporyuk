import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendChallengeRewardClaimedEmail, sendChallengeRewardApprovedEmail } from '@/lib/challenge-email-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/affiliate/challenges/[id]/claim - Claim reward for completed challenge
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: challengeId } = await params

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get challenge
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get user's progress
    const progress = await prisma.affiliateChallengeProgress.findUnique({
      where: {
        challengeId_affiliateId: {
          challengeId,
          affiliateId: affiliateProfile.id
        }
      }
    })

    if (!progress) {
      return NextResponse.json({ error: 'Not joined this challenge' }, { status: 400 })
    }

    if (!progress.completed) {
      return NextResponse.json({ error: 'Challenge not completed yet' }, { status: 400 })
    }

    if (progress.rewardClaimed) {
      return NextResponse.json({ error: 'Reward already claimed' }, { status: 400 })
    }

    if (progress.rewardStatus === 'PENDING') {
      return NextResponse.json({ error: 'Reward claim is pending admin approval' }, { status: 400 })
    }

    if (progress.rewardStatus === 'REJECTED') {
      return NextResponse.json({ 
        error: 'Reward claim was rejected', 
        reason: progress.rejectionReason 
      }, { status: 400 })
    }

    // Check auto-approve settings
    const settings = await prisma.settings.findFirst()
    const rewardValue = Number(challenge.rewardValue)
    const autoApproveEnabled = settings?.challengeRewardAutoApprove ?? false
    const autoApproveLimit = settings?.challengeRewardAutoApproveLimit 
      ? Number(settings.challengeRewardAutoApproveLimit) 
      : 500000

    // Auto-approve if enabled and within limit
    const shouldAutoApprove = autoApproveEnabled && rewardValue <= autoApproveLimit

    if (shouldAutoApprove) {
      // Process reward immediately
      if (challenge.rewardType === 'BONUS_COMMISSION') {
        await prisma.$transaction(async (tx) => {
          await tx.wallet.upsert({
            where: { userId: session.user.id },
            create: {
              userId: session.user.id,
              balance: rewardValue,
              totalEarnings: rewardValue
            },
            update: {
              balance: { increment: rewardValue },
              totalEarnings: { increment: rewardValue }
            }
          })

          const wallet = await tx.wallet.findUnique({
            where: { userId: session.user.id }
          })

          if (wallet) {
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                amount: rewardValue,
                type: 'CHALLENGE_REWARD',
                description: `Reward dari challenge: ${challenge.title} (Auto-approved)`
              }
            })
          }

          await tx.affiliateProfile.update({
            where: { id: affiliateProfile.id },
            data: {
              totalEarnings: { increment: rewardValue }
            }
          })

          await tx.affiliateChallengeProgress.update({
            where: { id: progress.id },
            data: {
              rewardStatus: 'APPROVED',
              rewardClaimed: true,
              claimedAt: new Date(),
              approvedAt: new Date(),
              updatedAt: new Date()
            }
          })
        })
      } else if (challenge.rewardType === 'TIER_UPGRADE') {
        await prisma.$transaction(async (tx) => {
          const affiliate = await tx.affiliateProfile.findUnique({
            where: { id: affiliateProfile.id }
          })
          
          if (affiliate) {
            const newTier = Math.min(affiliate.tier + Number(rewardValue), 5)
            await tx.affiliateProfile.update({
              where: { id: affiliateProfile.id },
              data: { tier: newTier }
            })
          }

          await tx.affiliateChallengeProgress.update({
            where: { id: progress.id },
            data: {
              rewardStatus: 'APPROVED',
              rewardClaimed: true,
              claimedAt: new Date(),
              approvedAt: new Date(),
              updatedAt: new Date()
            }
          })
        })
      } else {
        await prisma.affiliateChallengeProgress.update({
          where: { id: progress.id },
          data: {
            rewardStatus: 'APPROVED',
            rewardClaimed: true,
            claimedAt: new Date(),
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({ 
        success: true,
        message: 'Reward claimed and auto-approved successfully!',
        status: 'APPROVED',
        autoApproved: true
      }, { status: 200 })
    }

    // Send reward approved email in background (for auto-approved rewards)
    try {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (user?.email && shouldAutoApprove) {
        sendChallengeRewardApprovedEmail({
          email: user.email,
          name: affiliateProfile.displayName || user.name || 'Affiliate',
          challengeName: challenge.title,
          rewardValue: Number(challenge.rewardValue),
          rewardType: challenge.rewardType.replace(/_/g, ' '),
          approvalDate: new Date().toLocaleDateString('id-ID')
        }).catch(err => {
          console.error('Failed to send reward approved email:', err)
        })
      }
    } catch (emailErr) {
      console.error('Error sending reward approved email:', emailErr)
    }

    // Submit claim for admin approval (manual approval required)
    await prisma.affiliateChallengeProgress.update({
      where: { id: progress.id },
      data: {
        rewardStatus: 'PENDING',
        claimedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Send reward claimed email in background
    try {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (user?.email) {
        sendChallengeRewardClaimedEmail({
          email: user.email,
          name: affiliateProfile.displayName || user.name || 'Affiliate',
          challengeName: challenge.title,
          rewardValue: Number(challenge.rewardValue),
          rewardType: challenge.rewardType.replace(/_/g, ' '),
          claimDate: new Date().toLocaleDateString('id-ID'),
          claimStatus: 'PENDING'
        }).catch(err => {
          console.error('Failed to send reward claimed email:', err)
        })
      }
    } catch (emailErr) {
      console.error('Error sending reward claimed email:', emailErr)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Claim reward submitted. Waiting for admin approval.',
      status: 'PENDING',
      autoApproved: false
    })
  } catch (error) {
    console.error('Claim reward error:', error)
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    )
  }
}
