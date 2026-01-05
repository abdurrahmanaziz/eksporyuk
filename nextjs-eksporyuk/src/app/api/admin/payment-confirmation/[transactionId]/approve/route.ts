import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/payment-confirmation/[transactionId]/approve
 * Approve payment confirmation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await params
    const body = await request.json()
    const { notes } = body

    console.log('[Payment Approve] Processing approval for:', transactionId)

    // Find transaction with commission details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        amount: true,
        type: true,
        userId: true,
        customerName: true,
        customerEmail: true,
        membershipId: true,
        productId: true,
        courseId: true,
        couponId: true,
        affiliateId: true,
        metadata: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Transaksi tidak dapat diapprove' },
        { status: 400 }
      )
    }

    // Update transaction status to SUCCESS (not COMPLETED)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS', // This will be seen by /admin/sales as well
        paidAt: new Date(),
        notes: JSON.stringify({
          approvedBy: session.user.id,
          adminNotes: notes || 'Payment approved by admin',
          approvedAt: new Date().toISOString()
        }),
        updatedAt: new Date()
      }
    })

    console.log('[Payment Approve] Transaction status updated to COMPLETED')

    // Process membership/product activation (same logic as /admin/sales)
    if (transaction.type === 'MEMBERSHIP' && transaction.membershipId) {
      try {
        // Find or create user membership
        const existingMembership = await prisma.userMembership.findFirst({
          where: {
            userId: transaction.userId,
            membershipId: transaction.membershipId
          }
        })

        if (existingMembership) {
          // Extend existing membership
          const membership = await prisma.membership.findUnique({
            where: { id: transaction.membershipId },
            select: { duration: true }
          })

          if (membership) {
            const currentExpiry = existingMembership.expiresAt || new Date()
            const newExpiry = new Date(currentExpiry.getTime() + (membership.duration * 24 * 60 * 60 * 1000))

            await prisma.userMembership.update({
              where: { id: existingMembership.id },
              data: {
                status: 'ACTIVE',
                expiresAt: newExpiry,
                activatedAt: new Date()
              }
            })
            console.log('[Payment Approve] Extended existing membership')
          }
        } else {
          // Create new membership
          const membership = await prisma.membership.findUnique({
            where: { id: transaction.membershipId },
            select: { duration: true }
          })

          if (membership) {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + membership.duration)

            await prisma.userMembership.create({
              data: {
                userId: transaction.userId,
                membershipId: transaction.membershipId,
                status: 'ACTIVE',
                startedAt: new Date(),
                expiresAt,
                activatedAt: new Date(),
                transactionId: transaction.id
              }
            })
            console.log('[Payment Approve] Created new membership')

            // 🔥 AUTO-JOIN GROUPS AND ENROLL COURSES
            try {
              // Get membership groups
              const membershipGroups = await prisma.membershipGroup.findMany({
                where: { membershipId: transaction.membershipId },
                select: { groupId: true }
              })

              // Auto-join groups
              for (const mg of membershipGroups) {
                await prisma.groupMember.create({
                  data: {
                    groupId: mg.groupId,
                    userId: transaction.userId,
                    role: 'MEMBER'
                  }
                }).catch(() => {}) // Ignore if already member
              }

              // Get membership courses  
              const membershipCourses = await prisma.membershipCourse.findMany({
                where: { membershipId: transaction.membershipId },
                select: { courseId: true }
              })

              // Auto-enroll courses
              for (const mc of membershipCourses) {
                await prisma.courseEnrollment.create({
                  data: {
                    id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    userId: transaction.userId,
                    courseId: mc.courseId,
                    updatedAt: new Date()
                  }
                }).catch(() => {}) // Ignore if already enrolled
              }

              // Get membership products
              const membershipProducts = await prisma.membershipProduct.findMany({
                where: { membershipId: transaction.membershipId },
                select: { productId: true }
              })

              // Auto-grant products
              for (const mp of membershipProducts) {
                await prisma.userProduct.create({
                  data: {
                    userId: transaction.userId,
                    productId: mp.productId,
                    transactionId: transaction.id,
                    purchaseDate: new Date(),
                    price: 0 // Free as part of membership
                  }
                }).catch(() => {}) // Ignore if already owned
              }

              console.log(`[Payment Approve] Auto-assigned: ${membershipGroups.length} groups, ${membershipCourses.length} courses, ${membershipProducts.length} products`)
            } catch (activationError) {
              console.error('[Payment Approve] Failed to auto-assign groups/courses:', activationError)
            }
          }
        }
      } catch (membershipError) {
        console.error('[Payment Approve] Failed to activate membership:', membershipError)
      }
    }

    // Process commission if there's an affiliate
    if (transaction.affiliateId) {
      try {
        // Get commission configuration from membership or product
        let affiliateCommissionRate = 0
        let commissionType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE'
        
        // Get commission settings from membership or product based on transaction type
        if (transaction.type === 'MEMBERSHIP' && transaction.membershipId) {
          const membership = await prisma.membership.findUnique({
            where: { id: transaction.membershipId },
            select: { affiliateCommissionRate: true, commissionType: true }
          })
          if (membership) {
            affiliateCommissionRate = Number(membership.affiliateCommissionRate || 0)
            commissionType = (membership.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'
          }
        } else if (transaction.type === 'PRODUCT' && transaction.productId) {
          const product = await prisma.product.findUnique({
            where: { id: transaction.productId },
            select: { affiliateCommissionRate: true, commissionType: true }
          })
          if (product) {
            affiliateCommissionRate = Number(product.affiliateCommissionRate || 0)
            commissionType = (product.commissionType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE'
          }
        }
        
        // Get admin/founder/cofounder IDs
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true }
        })
        const founderUser = await prisma.user.findFirst({
          where: { isFounder: true },
          select: { id: true }
        })
        const cofounderUser = await prisma.user.findFirst({
          where: { isCoFounder: true },
          select: { id: true }
        })
        
        if (adminUser && founderUser && cofounderUser) {
          // Import commission helper
          const { processTransactionCommission } = await import('@/lib/commission-helper')
          await processTransactionCommission(
            transaction.id,
            transaction.affiliateId,
            adminUser.id,
            founderUser.id,
            cofounderUser.id,
            Number(transaction.amount),
            affiliateCommissionRate,
            commissionType
          )
          console.log('[Payment Approve] Commission processed successfully')
        } else {
          console.warn('[Payment Approve] Could not find system users for commission processing')
        }
      } catch (commissionError) {
        console.error('[Payment Approve] Failed to process commission:', commissionError)
      }
    }

    // Create notification for customer
    try {
      if (transaction.userId) {
        await prisma.notification.create({
          data: {
            userId: transaction.userId,
            type: 'PAYMENT',
            title: 'Pembayaran Dikonfirmasi',
            message: 'Pembayaran Anda telah dikonfirmasi dan transaksi berhasil diproses.',
            link: '/dashboard/transactions',
            redirectUrl: `/dashboard/transactions/${transactionId}`,
            sourceType: 'transaction',
            sourceId: transactionId,
            isRead: false,
            isSent: true,
            sentAt: new Date()
          }
        })
        console.log('[Payment Approve] Customer notification created')
      }
    } catch (notifError) {
      console.error('[Payment Approve] Failed to create notification:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil dikonfirmasi'
    })

  } catch (error: any) {
    console.error('[Payment Approve] Error:', error)
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}