import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { processRevenueDistribution } from '@/lib/revenue-split'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/transactions/process
 * Process a transaction and distribute revenue automatically
 * 
 * IMPORTANT: Commission dihitung dari amount yang dibayar (setelah kupon/diskon),
 * BUKAN dari harga package asli.
 * 
 * Body: {
 *   amount: number (final amount after coupon/discount)
 *   type: 'MEMBERSHIP' | 'COURSE' | 'PRODUCT'
 *   affiliateId?: string
 *   membershipId?: string (for getting commission settings)
 *   courseId?: string
 *   productId?: string (for getting commission settings)
 *   userId: string (buyer)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, affiliateId, membershipId, courseId, productId, userId } = body

    if (!amount || !type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get mentor info if course transaction
    let mentorId: string | undefined
    let mentorCommissionPercent: number | undefined

    if (type === 'COURSE' && courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  isFounder: true,
                  isCoFounder: true
                }
              }
            }
          }
        }
      })

      if (course) {
        mentorId = course.mentor.userId
        mentorCommissionPercent = Number(course.mentorCommissionPercent)
      }
    }

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    // Create main transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type,
        status: 'SUCCESS',
        invoiceNumber,
        description: `Purchase - ${type}`,
        metadata: {
          affiliateId,
          courseId,
          productId
        } as any
      }
    })

    // Process revenue distribution
    await processRevenueDistribution({
      amount,
      type,
      affiliateId,
      membershipId,
      courseId,
      productId,
      mentorId,
      mentorCommissionPercent,
      transactionId: transaction.id
    })

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction processed and revenue distributed'
    })

  } catch (error: any) {
    console.error('Transaction processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
