import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendChallengeJoinedEmail } from '@/lib/challenge-email-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/challenges - Get all challenges with user progress
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // active, upcoming, ended, all
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const now = new Date()
    let whereCondition: any = {}

    if (status === 'active') {
      whereCondition = {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    } else if (status === 'upcoming') {
      whereCondition = {
        isActive: true,
        startDate: { gt: now }
      }
    } else if (status === 'ended') {
      whereCondition = {
        endDate: { lt: now }
      }
    } else {
      whereCondition = {
        isActive: true
      }
    }

    // Get all challenges - AffiliateChallenge has no relations, so query separately
    const challenges = await prisma.affiliateChallenge.findMany({
      where: whereCondition,
      orderBy: { startDate: 'desc' },
      ...(limit && { take: limit })
    })

    // Get related data separately
    const membershipIds = [...new Set(challenges.filter(c => c.membershipId).map(c => c.membershipId!))]
    const productIds = [...new Set(challenges.filter(c => c.productId).map(c => c.productId!))]
    const courseIds = [...new Set(challenges.filter(c => c.courseId).map(c => c.courseId!))]
    const challengeIds = challenges.map(c => c.id)

    const [memberships, products, courses, userProgressList, progressCounts] = await Promise.all([
      membershipIds.length > 0 ? prisma.membership.findMany({
        where: { id: { in: membershipIds } },
        select: { id: true, name: true, slug: true, checkoutSlug: true }
      }) : [],
      productIds.length > 0 ? prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true, checkoutSlug: true }
      }) : [],
      courseIds.length > 0 ? prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true, slug: true, checkoutSlug: true }
      }) : [],
      prisma.affiliateChallengeProgress.findMany({
        where: { 
          challengeId: { in: challengeIds },
          affiliateId: affiliateProfile.id
        }
      }),
      prisma.affiliateChallengeProgress.groupBy({
        by: ['challengeId'],
        where: { challengeId: { in: challengeIds } },
        _count: true
      })
    ])

    const membershipMap = new Map(memberships.map(m => [m.id, m]))
    const productMap = new Map(products.map(p => [p.id, p]))
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const userProgressMap = new Map(userProgressList.map(p => [p.challengeId, p]))
    const progressCountMap = new Map(progressCounts.map(p => [p.challengeId, p._count]))

    // Get leaderboard for each challenge (top 10)
    const challengesWithLeaderboard = await Promise.all(
      challenges.map(async (challenge) => {
        // Get leaderboard progress entries
        const leaderboardProgress = await prisma.affiliateChallengeProgress.findMany({
          where: { challengeId: challenge.id },
          orderBy: { currentValue: 'desc' },
          take: 10
        })

        // Get affiliate profiles for leaderboard
        const affiliateIds = leaderboardProgress.map(p => p.affiliateId)
        const affiliates = affiliateIds.length > 0 ? await prisma.affiliateProfile.findMany({
          where: { id: { in: affiliateIds } }
        }) : []
        const userIds = affiliates.map(a => a.userId)
        const users = userIds.length > 0 ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatar: true }
        }) : []
        
        const affiliateMap = new Map(affiliates.map(a => [a.id, a]))
        const userMap = new Map(users.map(u => [u.id, u]))

        const leaderboard = leaderboardProgress.map((entry, idx) => {
          const affiliate = affiliateMap.get(entry.affiliateId)
          const user = affiliate ? userMap.get(affiliate.userId) : null
          return {
            rank: idx + 1,
            affiliateId: entry.affiliateId,
            name: user?.name || 'Unknown',
            avatar: user?.avatar || null,
            currentValue: Number(entry.currentValue),
            completed: entry.completed
          }
        })

        // Get user's rank
        let userRank = null
        const userProgress = userProgressMap.get(challenge.id)
        if (userProgress) {
          const higherRanked = await prisma.affiliateChallengeProgress.count({
            where: {
              challengeId: challenge.id,
              currentValue: { gt: userProgress.currentValue }
            }
          })
          userRank = higherRanked + 1
        }

        // Get related membership/product/course
        const membership = challenge.membershipId ? membershipMap.get(challenge.membershipId) : null
        const product = challenge.productId ? productMap.get(challenge.productId) : null
        const course = challenge.courseId ? courseMap.get(challenge.courseId) : null

        // Get affiliate link for this product/membership/course
        let affiliateLink = null
        let linkTarget = null
        
        if (challenge.membershipId) {
          const existingLink = await prisma.affiliateLink.findFirst({
            where: {
              affiliateId: affiliateProfile.id,
              membershipId: challenge.membershipId
            }
          })
          if (existingLink) {
            affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/go/${existingLink.shortCode}`
          }
          linkTarget = {
            type: 'membership',
            id: challenge.membershipId,
            name: membership?.name,
            slug: membership?.checkoutSlug || membership?.slug
          }
        } else if (challenge.productId) {
          const existingLink = await prisma.affiliateLink.findFirst({
            where: {
              affiliateId: affiliateProfile.id,
              productId: challenge.productId
            }
          })
          if (existingLink) {
            affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/go/${existingLink.shortCode}`
          }
          linkTarget = {
            type: 'product',
            id: challenge.productId,
            name: product?.name,
            slug: product?.checkoutSlug || product?.slug
          }
        } else if (challenge.courseId) {
          const existingLink = await prisma.affiliateLink.findFirst({
            where: {
              affiliateId: affiliateProfile.id,
              courseId: challenge.courseId
            }
          })
          if (existingLink) {
            affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/go/${existingLink.shortCode}`
          }
          linkTarget = {
            type: 'course',
            id: challenge.courseId,
            name: course?.title,
            slug: course?.checkoutSlug || course?.slug
          }
        }

        return {
          ...challenge,
          membership,
          product,
          course,
          hasJoined: !!userProgress, // Explicit hasJoined flag
          userProgress: userProgress ? {
            currentValue: Number(userProgress.currentValue),
            progress: (Number(userProgress.currentValue) / Number(challenge.targetValue)) * 100,
            completed: userProgress.completed,
            rewardClaimed: userProgress.rewardClaimed
          } : null,
          userRank,
          affiliateLink,
          linkTarget,
          leaderboard,
          participantsCount: progressCountMap.get(challenge.id) || 0,
          status: challenge.startDate > now ? 'upcoming' : challenge.endDate < now ? 'ended' : 'active',
          daysRemaining: Math.ceil((challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
      })
    )

    return NextResponse.json({ challenges: challengesWithLeaderboard })
  } catch (error) {
    console.error('Get affiliate challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST /api/affiliate/challenges - Join a challenge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId } = body

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Check if challenge exists and is active
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const now = new Date()
    if (!challenge.isActive || challenge.startDate > now || challenge.endDate < now) {
      return NextResponse.json({ error: 'Challenge is not available' }, { status: 400 })
    }

    // Check if already joined
    const existingProgress = await prisma.affiliateChallengeProgress.findUnique({
      where: {
        challengeId_affiliateId: {
          challengeId,
          affiliateId: affiliateProfile.id
        }
      }
    })

    if (existingProgress) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 })
    }

    // Join challenge
    const progress = await prisma.affiliateChallengeProgress.create({
      data: {
        challengeId,
        affiliateId: affiliateProfile.id,
        currentValue: 0
      }
    })

    // Send notifications in background (don't wait for them)
    try {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      const daysRemaining = Math.ceil((challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (user?.email) {
        // Send email notification
        sendChallengeJoinedEmail({
          email: user.email,
          name: affiliateProfile.displayName || user.name || 'Affiliate',
          challengeName: challenge.title,
          challengeDescription: challenge.description || '',
          targetValue: Number(challenge.targetValue),
          targetType: challenge.targetType.replace(/_/g, ' '),
          rewardValue: Number(challenge.rewardValue),
          rewardType: challenge.rewardType.replace(/_/g, ' '),
          currentValue: 0,
          startDate: challenge.startDate.toLocaleDateString('id-ID'),
          endDate: challenge.endDate.toLocaleDateString('id-ID'),
          daysRemaining
        }).catch(err => {
          console.error('Failed to send challenge joined email:', err)
        })

        // Send push notification
        notificationService.send({
          userId: session.user.id,
          type: 'AFFILIATE' as any,
          title: '🎯 Tantangan Berhasil Diikuti!',
          message: `Anda berhasil mengikuti tantangan "${challenge.title}". Target: ${challenge.targetValue} ${challenge.targetType.replace(/_/g, ' ').toLowerCase()}. Reward: ${challenge.rewardType === 'CASH_BONUS' ? 'Rp ' + Number(challenge.rewardValue).toLocaleString('id-ID') : challenge.rewardType.replace(/_/g, ' ')}.`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/challenges/${challenge.id}`,
          channels: ['pusher', 'onesignal'],
          metadata: {
            challengeId: challenge.id,
            challengeName: challenge.title,
            targetValue: challenge.targetValue,
            rewardValue: challenge.rewardValue
          }
        }).catch(err => {
          console.error('Failed to send push notification:', err)
        })

        // Send WhatsApp notification if available
        const waNumber = user.whatsapp || user.phone
        if (waNumber && starsenderService.isConfigured()) {
          const waMessage = `🎯 *Tantangan Berhasil Diikuti!*\n\nHalo ${user.name}!\n\nAnda berhasil mengikuti tantangan:\n\n📋 *${challenge.title}*\n🎯 Target: ${challenge.targetValue} ${challenge.targetType.replace(/_/g, ' ').toLowerCase()}\n🏆 Reward: ${challenge.rewardType === 'CASH_BONUS' ? 'Rp ' + Number(challenge.rewardValue).toLocaleString('id-ID') : challenge.rewardType.replace(/_/g, ' ')}\n⏰ Deadline: ${daysRemaining} hari lagi\n\n✨ Semangat meraih target! 🚀\n\nLihat progress: ${process.env.NEXT_PUBLIC_APP_URL}/affiliate/challenges/${challenge.id}`
          
          starsenderService.sendWhatsApp({
            to: waNumber,
            message: waMessage
          }).catch(err => {
            console.error('Failed to send WhatsApp notification:', err)
          })
        }
      }
    } catch (emailErr) {
      console.error('Error sending challenge notifications:', emailErr)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}
