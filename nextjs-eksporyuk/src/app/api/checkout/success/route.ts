import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { activateMembership, activateProduct } from '@/lib/membership-helper'
import { processTransactionCommission, getAffiliateFromCode } from '@/lib/commission-helper'
import { updateChallengeProgress } from '@/lib/challenge-helper'
import { smartNotificationService } from '@/lib/services/smartNotificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/checkout/success - Handle successful payment
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
      transactionId,
      externalId, // Xendit payment ID
      amount,
      type, // 'MEMBERSHIP' or 'PRODUCT'
      membershipId,
      productId,
      affiliateCode, // Optional affiliate tracking code
      duration // For membership
    } = body

    // 1. Get or update transaction
    let transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { id: transactionId },
          { externalId }
        ]
      },
      include: {
        product: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // 2. Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        paidAt: new Date()
      }
    })

    // 3. Get affiliate ID from code if provided
    let affiliateId: string | undefined
    if (affiliateCode) {
      const affiliate = await getAffiliateFromCode(affiliateCode)
      affiliateId = affiliate?.affiliateId
    }

    // 4. Get system users for commission distribution
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

    // 5. Get affiliate commission rate and type from membership or product
    let affiliateCommissionRate = 30 // Default
    let commissionType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE' // Default
    if (type === 'MEMBERSHIP' && membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        select: { affiliateCommissionRate: true, commissionType: true }
      })
      affiliateCommissionRate = Number(membership?.affiliateCommissionRate || 30)
      commissionType = (membership?.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'
    } else if (type === 'PRODUCT' && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { affiliateCommissionRate: true, commissionType: true }
      })
      affiliateCommissionRate = Number(product?.affiliateCommissionRate || 30)
      commissionType = (product?.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'
    }

    // 6. Calculate and distribute commission
    await processTransactionCommission(
      transaction.id,
      affiliateId || null,
      admin.id,
      founder.id,
      coFounder.id,
      Number(amount),
      affiliateCommissionRate,
      commissionType
    )

    // 7. Activate membership or product
    let activationResult
    
    if (type === 'MEMBERSHIP' && membershipId) {
      // Calculate dates
      const startDate = new Date()
      const durationMap: any = {
        'ONE_MONTH': 30,
        'THREE_MONTHS': 90,
        'SIX_MONTHS': 180,
        'TWELVE_MONTHS': 365,
        'LIFETIME': 36500
      }
      
      const days = durationMap[duration] || 30
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      activationResult = await activateMembership(
        session.user.id,
        membershipId,
        transaction.id,
        startDate,
        endDate,
        Number(amount)
      )
    } else if (type === 'PRODUCT' && productId) {
      activationResult = await activateProduct(
        session.user.id,
        productId,
        transaction.id,
        Number(amount),
        null // No expiry for products by default
      )
    }

    // 8. Create affiliate conversion if affiliate exists
    if (affiliateId) {
      await prisma.affiliateConversion.create({
        data: {
          linkId: affiliateCode, // Store the code used
          transactionId: transaction.id,
          amount: Number(amount),
          status: 'COMPLETED'
        }
      })

      // Update challenge progress untuk affiliate
      await updateChallengeProgress({
        affiliateId,
        membershipId: type === 'MEMBERSHIP' ? membershipId : null,
        productId: type === 'PRODUCT' ? productId : null,
        transactionAmount: Number(amount)
      })
    }

    // 9. Send purchase notification to user
    const productName = type === 'MEMBERSHIP' 
      ? (await prisma.membership.findUnique({ where: { id: membershipId }, select: { name: true } }))?.name 
      : (await prisma.product.findUnique({ where: { id: productId }, select: { name: true } }))?.name

    try {
      await smartNotificationService.send({
        userId: session.user.id,
        type: 'PAYMENT',
        title: 'Payment Confirmed ✅',
        message: `Your purchase of ${productName || 'item'} has been confirmed. Thank you!`,
        link: '/wallet',
        data: {
          transactionId: transaction.id,
          amount: Number(amount),
          productName,
          type
        },
        channels: {
          pusher: true,
          onesignal: true
        },
        priority: 'high'
      })
    } catch (notifError) {
      // Don't fail transaction if notification fails
      console.error('[PAYMENT_NOTIFICATION_ERROR]', notifError)
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: 'SUCCESS'
      },
      activation: activationResult
    })
  } catch (error: any) {
    console.error('Checkout success error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process checkout' },
      { status: 500 }
    )
  }
}
