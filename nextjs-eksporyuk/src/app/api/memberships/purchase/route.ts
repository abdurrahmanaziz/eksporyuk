import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { processRevenueDistribution } from '@/lib/revenue-split'
import { updateChallengeProgress } from '@/lib/challenge-helper'

/**
 * POST /api/memberships/purchase
 * Process membership purchase with payment
 * 
 * Body: {
 *   membershipId: string
 *   paymentMethod: string (e.g., 'xendit', 'manual')
 *   affiliateId?: string
 *   couponCode?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        name: true, 
        email: true,
        userMemberships: {
          where: { status: 'ACTIVE' },
          select: { id: true, membershipId: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has active membership
    if (user.userMemberships.length > 0) {
      return NextResponse.json(
        { 
          error: 'You already have an active membership. Please upgrade instead.',
          redirect: '/dashboard/upgrade'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { membershipId, paymentMethod, affiliateId, couponCode } = body

    if (!membershipId) {
      return NextResponse.json(
        { error: 'Membership ID is required' },
        { status: 400 }
      )
    }

    // Get membership details
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        membershipGroups: {
          include: { group: { select: { id: true, name: true } } }
        },
        membershipCourses: {
          include: { course: { select: { id: true, title: true } } }
        },
        membershipProducts: {
          include: { product: { select: { id: true, name: true } } }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (!membership.isActive) {
      return NextResponse.json(
        { error: 'This membership plan is not available' },
        { status: 400 }
      )
    }

    // Calculate price (with coupon if provided)
    let finalPrice = Number(membership.price)
    let discountAmount = 0
    let couponId: string | undefined

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      })

      if (coupon && coupon.isActive) {
        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          return NextResponse.json(
            { error: 'Coupon usage limit exceeded' },
            { status: 400 }
          )
        }

        // Check expiry
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return NextResponse.json(
            { error: 'Coupon has expired' },
            { status: 400 }
          )
        }

        // Calculate discount
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = finalPrice * (Number(coupon.discountValue) / 100)
        } else {
          discountAmount = Number(coupon.discountValue)
        }

        finalPrice -= discountAmount
        couponId = coupon.id

        // Update coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } }
        })
      }
    }

    // Calculate membership end date
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
        endDate.setFullYear(endDate.getFullYear() + 100) // 100 years
        break
    }

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'MEMBERSHIP',
        status: paymentMethod === 'manual' ? 'PENDING' : 'SUCCESS',
        amount: finalPrice,
        originalAmount: Number(membership.price),
        discountAmount,
        couponId,
        invoiceNumber,
        description: `Purchase Membership: ${membership.name}`,
        paymentMethod,
        paymentProvider: paymentMethod === 'xendit' ? 'XENDIT' : 'MANUAL',
        customerName: user.name || '',
        customerEmail: user.email || '',
        metadata: {
          membershipId,
          affiliateId,
          duration: membership.duration
        } as any
      }
    })

    // If payment is successful (or manual for testing), activate membership
    if (transaction.status === 'SUCCESS') {
      // Create UserMembership
      const userMembership = await prisma.userMembership.create({
        data: {
          userId: user.id,
          membershipId,
          transactionId: transaction.id,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          autoRenew: false
        }
      })

      // Auto-join groups
      for (const mg of membership.membershipGroups) {
        await prisma.groupMember.create({
          data: {
            groupId: mg.group.id,
            userId: user.id,
            role: 'MEMBER'
          }
        }).catch(() => {}) // Ignore if already member
      }

      // Auto-enroll courses
      for (const mc of membership.membershipCourses) {
        await prisma.courseEnrollment.create({
          data: {
            userId: user.id,
            courseId: mc.course.id
          }
        }).catch(() => {}) // Ignore if already enrolled
      }

      // Auto-grant products
      for (const mp of membership.membershipProducts) {
        await prisma.userProduct.create({
          data: {
            userId: user.id,
            productId: mp.product.id,
            transactionId: transaction.id,
            purchaseDate: now,
            price: 0
          }
        }).catch(() => {}) // Ignore if already owned
      }

      // Process revenue distribution
      await processRevenueDistribution({
        amount: finalPrice,
        type: 'MEMBERSHIP',
        affiliateId,
        membershipId,
        transactionId: transaction.id
      })

      // Track affiliate conversion
      if (affiliateId) {
        await prisma.affiliateConversion.create({
          data: {
            affiliateId,
            transactionId: transaction.id,
            commissionAmount: 0, // Will be calculated by revenue split
            status: 'APPROVED'
          }
        }).catch(() => {}) // Ignore errors

        // Update challenge progress untuk affiliate
        await updateChallengeProgress({
          affiliateId,
          membershipId,
          transactionAmount: finalPrice
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Membership activated successfully!',
        data: {
          userMembership,
          transaction,
          membership: {
            name: membership.name,
            duration: membership.duration,
            endDate
          },
          access: {
            groups: membership.membershipGroups.length,
            courses: membership.membershipCourses.length,
            products: membership.membershipProducts.length
          }
        }
      })
    }

    // If payment is pending (e.g., waiting for Xendit)
    return NextResponse.json({
      success: true,
      message: 'Payment pending. Please complete the payment.',
      data: {
        transaction,
        paymentUrl: transaction.paymentUrl, // To be set by Xendit webhook
        status: 'PENDING'
      }
    })

  } catch (error: any) {
    console.error('Membership purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to purchase membership' },
      { status: 500 }
    )
  }
}
