import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { upgradeMembership } from '@/lib/membership-helper'
import { processTransactionCommission, getAffiliateFromCode } from '@/lib/commission-helper'
import { updateChallengeProgress } from '@/lib/challenge-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/memberships/upgrade - Upgrade user membership
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      newMembershipId,
      paymentMode, // 'accumulate' or 'full'
      transactionId,
      amount,
      affiliateCode
    } = body

    if (!newMembershipId || !paymentMode || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 1. Get affiliate if code provided
    let affiliateId: string | undefined
    if (affiliateCode) {
      const affiliate = await getAffiliateFromCode(affiliateCode)
      affiliateId = affiliate?.affiliateId
    }

    // 2. Get system users for commission distribution
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    const founder = await prisma.user.findFirst({
      where: { isFounder: true },
      select: { id: true }
    })
    const coFounder = await prisma.user.findFirst({
      where: { isCoFounder: true },
      select: { id: true }
    })

    if (!admin || !founder || !coFounder) {
      throw new Error('System users not found')
    }

    // 3. Get affiliate commission rate and type from new membership
    const newMembership = await prisma.membership.findUnique({
      where: { id: newMembershipId },
      select: { affiliateCommissionRate: true, commissionType: true }
    })
    const affiliateCommissionRate = Number(newMembership?.affiliateCommissionRate || 30)
    const commissionType = (newMembership?.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'

    // 4. Calculate and distribute commission
    await processTransactionCommission(
      transactionId,
      affiliateId || null,
      admin.id,
      founder.id,
      coFounder.id,
      Number(amount),
      affiliateCommissionRate,
      commissionType
    )

    // 5. Perform upgrade
    const result = await upgradeMembership(
      session.user.id,
      newMembershipId,
      paymentMode,
      transactionId,
      Number(amount)
    )

    // 6. Create affiliate conversion if affiliate exists
    if (affiliateId) {
      await prisma.affiliateConversion.create({
        data: {
          linkId: affiliateCode,
          transactionId,
          amount: Number(amount),
          status: 'COMPLETED'
        }
      })

      // Update challenge progress untuk affiliate
      await updateChallengeProgress({
        affiliateId,
        membershipId: newMembershipId,
        transactionAmount: Number(amount)
      })
    }

    return NextResponse.json({
      success: true,
      upgrade: result
    })
  } catch (error: any) {
    console.error('Membership upgrade error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade membership' },
      { status: 500 }
    )
  }
}

// GET /api/memberships/upgrade/calculate - Calculate upgrade price
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const newMembershipId = searchParams.get('membershipId')
    const paymentMode = searchParams.get('mode') || 'full'

    if (!newMembershipId) {
      return NextResponse.json(
        { error: 'Membership ID required' },
        { status: 400 }
      )
    }

    // Get current active membership
    const currentMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        status: 'ACTIVE'
      },
      include: {
        membership: true
      }
    })

    // Get new membership
    const newMembership = await prisma.membership.findUnique({
      where: { id: newMembershipId }
    })

    if (!newMembership) {
      return NextResponse.json(
        { error: 'New membership not found' },
        { status: 404 }
      )
    }

    let price = Number(newMembership.price)
    let discount = 0
    let remainingDays = 0

    if (paymentMode === 'accumulate' && currentMembership) {
      // Calculate remaining value
      const now = new Date()
      const endDate = new Date(currentMembership.endDate)
      
      if (endDate > now) {
        remainingDays = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Calculate daily rate of current membership
        const durationMap: any = {
          'ONE_MONTH': 30,
          'THREE_MONTHS': 90,
          'SIX_MONTHS': 180,
          'TWELVE_MONTHS': 365,
          'LIFETIME': 36500
        }
        
        const currentDuration = durationMap[currentMembership.membership.duration] || 30
        const dailyRate = Number(currentMembership.price) / currentDuration
        const remainingValue = dailyRate * remainingDays
        
        discount = remainingValue
        price = Math.max(0, price - discount)
      }
    }

    return NextResponse.json({
      currentMembership: currentMembership ? {
        name: currentMembership.membership.name,
        price: Number(currentMembership.price),
        endDate: currentMembership.endDate,
        remainingDays
      } : null,
      newMembership: {
        name: newMembership.name,
        price: Number(newMembership.price),
        originalPrice: newMembership.originalPrice ? Number(newMembership.originalPrice) : null
      },
      calculation: {
        originalPrice: Number(newMembership.price),
        discount,
        finalPrice: price,
        paymentMode,
        remainingDays
      }
    })
  } catch (error) {
    console.error('Calculate upgrade error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate upgrade price' },
      { status: 500 }
    )
  }
}
