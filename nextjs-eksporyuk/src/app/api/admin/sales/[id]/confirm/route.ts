import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { processTransactionCommission } from '@/lib/commission-helper'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

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

    // ===== HANDLE MEMBERSHIP ACTIVATION =====
    if (transaction.type === 'MEMBERSHIP') {
      // Get membershipId from transaction field OR metadata
      const metadata = transaction.metadata as any
      const membershipId = transaction.membershipId || metadata?.membershipId

      if (membershipId) {
        const membership = await prisma.membership.findUnique({ 
          where: { id: membershipId } 
        })

        if (membership) {
          // Calculate end date based on duration
          const now = new Date()
          let endDate = new Date(now)
          
          switch (membership.duration) {
            case 'ONE_MONTH':
              endDate.setMonth(endDate.getMonth() + 1)
              break
            case 'THREE_MONTHS':
              endDate.setMonth(endDate.getMonth() + 3)
              break
            case 'SIX_MONTHS':
              endDate.setMonth(endDate.getMonth() + 6)
              break
            case 'TWELVE_MONTHS':
              endDate.setFullYear(endDate.getFullYear() + 1)
              break
            case 'LIFETIME':
              endDate.setFullYear(endDate.getFullYear() + 100)
              break
            default:
              // If duration is a number (legacy), use as days
              const durationValue = typeof membership.duration === 'number' ? membership.duration : 365
              endDate = new Date(Date.now() + durationValue * 24 * 60 * 60 * 1000)
          }

          // 🔒 DEACTIVATE OLD MEMBERSHIPS - User can only have 1 active membership
          await prisma.userMembership.updateMany({
            where: { 
              userId: transaction.userId,
              isActive: true
            },
            data: { 
              isActive: false,
              status: 'EXPIRED'
            }
          })

          // 🔒 CANCEL OTHER PENDING MEMBERSHIP TRANSACTIONS
          const cancelledTransactions = await prisma.transaction.updateMany({
            where: {
              userId: transaction.userId,
              type: 'MEMBERSHIP',
              status: 'PENDING',
              id: { not: transaction.id }
            },
            data: {
              status: 'CANCELLED',
            }
          })
          
          if (cancelledTransactions.count > 0) {
            console.log(`[Admin Confirm] ✅ Auto-cancelled ${cancelledTransactions.count} pending membership transactions for user ${transaction.userId}`)
          }

          // Check if UserMembership already exists for this transaction
          let userMembership = await prisma.userMembership.findUnique({
            where: { transactionId: transaction.id },
          })

          if (userMembership) {
            // UPDATE existing UserMembership
            await prisma.userMembership.update({
              where: { id: userMembership.id },
              data: {
                status: 'ACTIVE',
                isActive: true,
                startDate: now,
                endDate,
                activatedAt: now,
                updatedAt: now
              }
            })
            console.log(`[Admin Confirm] ✅ Updated existing UserMembership to ACTIVE`)
          } else {
            // CREATE new UserMembership (for PENDING transactions that didn't have one)
            userMembership = await prisma.userMembership.create({
              data: {
                id: `um_${transaction.id}`,
                userId: transaction.userId,
                membershipId: membershipId,
                transactionId: transaction.id,
                status: 'ACTIVE',
                isActive: true,
                startDate: now,
                endDate,
                activatedAt: now,
                price: transaction.amount
              }
            })
            console.log(`[Admin Confirm] ✅ Created NEW UserMembership for transaction ${transaction.id}`)
          }

          // Update user role to MEMBER_PREMIUM
          await prisma.user.update({
            where: { id: transaction.userId },
            data: { role: 'MEMBER_PREMIUM' }
          })
          console.log(`[Admin Confirm] ✅ User role upgraded to MEMBER_PREMIUM`)

          // ===== AUTO-JOIN GROUPS =====
          const membershipGroups = await prisma.membershipGroup.findMany({
            where: { membershipId: membership.id }
          })

        for (const mg of membershipGroups) {
          try {
            // Check if already member
            const existingMember = await prisma.groupMember.findUnique({
              where: {
                groupId_userId: {
                  groupId: mg.groupId,
                  userId: transaction.userId
                }
              }
            })

            if (!existingMember) {
              await prisma.groupMember.create({
                data: {
                  id: createId(),
                  groupId: mg.groupId,
                  userId: transaction.userId,
                  role: 'MEMBER'
                }
              })
              console.log(`[Admin Confirm] ✅ User ${transaction.userId} added to group ${mg.groupId}`)
            }
          } catch (groupError) {
            console.error(`[Admin Confirm] Error adding user to group ${mg.groupId}:`, groupError)
          }
        }

        // ===== AUTO-ENROLL COURSES =====
        // Get courses linked to this membership
        const membershipCourses = await prisma.membershipCourse.findMany({
          where: { membershipId: membership.id }
        })

        for (const mc of membershipCourses) {
          try {
            // Check if already enrolled (no unique constraint, use findFirst)
            const existingEnrollment = await prisma.courseEnrollment.findFirst({
              where: {
                courseId: mc.courseId,
                userId: transaction.userId
              }
            })

            if (!existingEnrollment) {
              await prisma.courseEnrollment.create({
                data: {
                  id: createId(),
                  courseId: mc.courseId,
                  userId: transaction.userId,
                  updatedAt: new Date()
                }
              })
              console.log(`[Admin Confirm] ✅ User ${transaction.userId} enrolled in course ${mc.courseId}`)
            }
          } catch (courseError) {
            console.error(`[Admin Confirm] Error enrolling user in course ${mc.courseId}:`, courseError)
          }
        }

        // ===== AUTO-GRANT PRODUCTS =====
        // Get products linked to this membership
        const membershipProducts = await prisma.membershipProduct.findMany({
          where: { membershipId: membership.id }
        })

        for (const mp of membershipProducts) {
          try {
            // Check if already owned
            const existingProduct = await prisma.userProduct.findFirst({
              where: {
                productId: mp.productId,
                userId: transaction.userId
              }
            })

            if (!existingProduct) {
              await prisma.userProduct.create({
                data: {
                  userId: transaction.userId,
                  productId: mp.productId,
                  transactionId: transaction.id,
                  purchaseDate: new Date(),
                  price: 0 // Free as part of membership
                }
              })
              console.log(`[Admin Confirm] ✅ User ${transaction.userId} granted product ${mp.productId}`)
            }
          } catch (productError) {
            console.error(`[Admin Confirm] Error granting product ${mp.productId}:`, productError)
          }
        }

        console.log(`[Admin Confirm] ✅ Membership activated with ${membershipGroups.length} groups, ${membershipCourses.length} courses, ${membershipProducts.length} products`)
      }
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
      let affiliateCommissionRate = 0
      let commissionType: 'PERCENTAGE' | 'FLAT' = 'PERCENTAGE'
      
      // Check for affiliate from transaction metadata or affiliateConversion
      const affiliateConversion = await prisma.affiliateConversion.findFirst({
        where: { transactionId: transaction.id }
      })
      
      if (affiliateConversion) {
        affiliateId = affiliateConversion.affiliateId
      }

      // Get commission settings from membership or product
      const userMembership = await prisma.userMembership.findUnique({
        where: { transactionId: transaction.id }
      })

      if (userMembership) {
        const membership = await prisma.membership.findUnique({
          where: { id: userMembership.membershipId },
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
