import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { processTransactionCommission } from '@/lib/commission-helper'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = params.id

    // Get transaction (no relations in schema)
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Get related data with manual lookups
    const user = await prisma.user.findUnique({ where: { id: transaction.userId } })
    const product = transaction.productId ? await prisma.product.findUnique({ where: { id: transaction.productId } }) : null
    const course = transaction.courseId ? await prisma.course.findUnique({ where: { id: transaction.courseId } }) : null

    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ error: 'Transaction already confirmed' }, { status: 400 })
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: 'SUCCESS',
        updatedAt: new Date()
      },
    })

    // Activate membership if exists
    if (transaction.membershipId) {
      const membershipTransaction = await prisma.membershipTransaction.findFirst({
        where: { transactionId: transaction.id },
      })
      
      // Get membership data manually
      const membership = membershipTransaction 
        ? await prisma.membership.findUnique({ where: { id: membershipTransaction.membershipId } })
        : null

      if (membershipTransaction && membership) {
        const duration = membership.duration
        const expiresAt = duration === 'LIFETIME' 
          ? null 
          : new Date(Date.now() + duration * 24 * 60 * 60 * 1000)

        await prisma.userMembership.create({
          data: {
            userId: transaction.userId,
            membershipId: transaction.membershipId,
            status: 'ACTIVE',
            expiresAt,
          }
        })

        // Update user role to MEMBER_PREMIUM if not already
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { role: 'MEMBER_PREMIUM' }
        })
      }
    }

    // Process commission if affiliate conversion exists
    // Get system users for commission distribution
    const [admin, founder, coFounder] = await Promise.all([
      prisma.user.findFirst({ where: { role: 'ADMIN' } }),
      prisma.user.findFirst({ where: { isFounder: true } }),
      prisma.user.findFirst({ where: { isCoFounder: true } })
    ])

    if (admin && founder && coFounder) {
      // Get affiliate info and commission settings
      let affiliateId: string | null = null
      let affiliateCommissionRate = 30
      let commissionType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE'
      
      // Check for affiliate from transaction metadata or affiliateConversion
      const affiliateConversion = await prisma.affiliateConversion.findFirst({
        where: { transactionId: transaction.id }
      })
      
      if (affiliateConversion) {
        affiliateId = affiliateConversion.affiliateId
      }

      // Get commission settings from membership or product
      if (transaction.membershipId) {
        const membership = await prisma.membership.findUnique({
          where: { id: transaction.membershipId },
          select: { affiliateCommissionRate: true, commissionType: true }
        })
        if (membership) {
          affiliateCommissionRate = Number(membership.affiliateCommissionRate)
          commissionType = (membership.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'
        }
      } else if (transaction.productId) {
        const product = await prisma.product.findUnique({
          where: { id: transaction.productId },
          select: { affiliateCommissionRate: true, commissionType: true }
        })
        if (product) {
          affiliateCommissionRate = Number(product.affiliateCommissionRate)
          commissionType = (product.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'
        }
      }

      // Process commission distribution
      try {
        await processTransactionCommission(
          transaction.id,
          affiliateId,
          admin.id,
          founder.id,
          coFounder.id,
          Number(transaction.amount),
          affiliateCommissionRate,
          commissionType
        )
      } catch (commissionError) {
        console.error('Commission processing error:', commissionError)
        // Don't fail the whole confirmation if commission fails
      }
    }

    // Send notification (optional - can be expanded)
    // await notificationService.sendTransactionConfirmed(transaction)

    return NextResponse.json({ 
      success: true, 
      transaction: updatedTransaction 
    })

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ 
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
