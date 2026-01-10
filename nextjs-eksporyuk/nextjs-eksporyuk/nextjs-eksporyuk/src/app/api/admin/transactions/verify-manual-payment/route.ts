import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/transactions/verify-manual-payment
 * Admin endpoint to manually verify/approve a manual transfer transaction
 * This activates the membership immediately without waiting for webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status !== 'SUCCESS' && transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot verify transaction with status: ${transaction.status}` },
        { status: 400 }
      )
    }

    if (transaction.paymentMethod !== 'MANUAL_TRANSFER' && transaction.paymentMethod !== 'INVOICE') {
      return NextResponse.json(
        { error: 'This endpoint is only for manual transfer payments' },
        { status: 400 }
      )
    }

    // Check transaction type
    if (transaction.type !== 'MEMBERSHIP') {
      return NextResponse.json(
        { error: 'Only membership transactions are supported' },
        { status: 400 }
      )
    }

    const metadata = transaction.metadata as any
    const membershipId = metadata?.membershipId || transaction.membershipId

    if (!membershipId) {
      return NextResponse.json(
        { error: 'No membership associated with this transaction' },
        { status: 400 }
      )
    }

    // Get membership details
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Check if user already has this membership
    const existingMembership = await prisma.userMembership.findFirst({
      where: { userId: transaction.userId, membershipId }
    })

    const now = new Date()

    if (existingMembership) {
      // Just reactivate if not active
      if (!existingMembership.isActive) {
        await prisma.userMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            activatedAt: now
          }
        })
      }
    } else {
      // Create new membership
      // Fetch related data
      const [membershipGroups, membershipCourses, membershipProducts] = await Promise.all([
        prisma.membershipGroup.findMany({ where: { membershipId } }),
        prisma.membershipCourse.findMany({ where: { membershipId } }),
        prisma.membershipProduct.findMany({ where: { membershipId } })
      ])

      const groupIds = membershipGroups.map(mg => mg.groupId)
      const courseIds = membershipCourses.map(mc => mc.courseId)
      const productIds = membershipProducts.map(mp => mp.productId)

      const [groups, courses, products] = await Promise.all([
        groupIds.length > 0
          ? prisma.group.findMany({ where: { id: { in: groupIds } } })
          : [],
        courseIds.length > 0
          ? prisma.course.findMany({ where: { id: { in: courseIds } } })
          : [],
        productIds.length > 0
          ? prisma.product.findMany({ where: { id: { in: productIds } } })
          : []
      ])

      // Calculate end date
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
      }

      // Create UserMembership
      const umId = `um_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await prisma.userMembership.create({
        data: {
          id: umId,
          userId: transaction.userId,
          membershipId,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: now,
          startDate: now,
          endDate,
          price: transaction.amount,
          transactionId: transaction.id,
          updatedAt: now,
          createdAt: now
        }
      })

      // Auto-join groups
      for (const group of groups) {
        await prisma.groupMember
          .create({
            data: {
              groupId: group.id,
              userId: transaction.userId,
              role: 'MEMBER'
            }
          })
          .catch(() => {}) // Ignore if already member
      }

      // Auto-enroll courses
      for (const course of courses) {
        await prisma.courseEnrollment
          .create({
            data: {
              id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              userId: transaction.userId,
              courseId: course.id,
              updatedAt: new Date()
            }
          })
          .catch(() => {}) // Ignore if already enrolled
      }

      // Auto-grant products
      for (const product of products) {
        await prisma.userProduct
          .create({
            data: {
              userId: transaction.userId,
              productId: product.id,
              transactionId: transaction.id,
              purchaseDate: now,
              price: 0
            }
          })
          .catch(() => {}) // Ignore if already owned
      }
    }

    // Upgrade user role if needed
    if (transaction.user.role === 'MEMBER_FREE' || transaction.user.role === 'CUSTOMER') {
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { role: 'MEMBER_PREMIUM' }
      })
    }

    // Update transaction status if it was PENDING
    if (transaction.status === 'PENDING') {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'SUCCESS',
          paidAt: now
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Manual payment verified and membership activated',
      data: {
        transactionId,
        userId: transaction.userId,
        membership: membership.name,
        userRole: 'MEMBER_PREMIUM'
      }
    })
  } catch (error) {
    console.error('[Admin] Error verifying manual payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
