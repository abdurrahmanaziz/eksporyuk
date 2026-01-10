import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to check payment status directly from Xendit
 * This is a fallback when webhook doesn't arrive
 * 
 * GET /api/payment/check-status/[transactionId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params

    // Find transaction (no need to include user, we have userId)
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If already SUCCESS, just return status
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        status: 'SUCCESS',
        message: 'Payment already confirmed',
        paidAt: transaction.paidAt
      })
    }

    // If not pending, return current status
    if (transaction.status !== 'PENDING') {
      return NextResponse.json({
        status: transaction.status,
        message: `Transaction status: ${transaction.status}`
      })
    }

    // Check payment status from Xendit
    const reference = transaction.reference
    const metadata = transaction.metadata as any

    if (!reference) {
      return NextResponse.json({
        status: 'PENDING',
        message: 'No payment reference found'
      })
    }

    let xenditStatus = 'PENDING'
    let paymentData: any = null

    try {
      // Check if reference is Payment Request ID (starts with 'pr-')
      if (reference.startsWith('pr-')) {
        console.log('[Check Status] Checking Payment Request:', reference)
        const paymentRequest = await xenditService.getPaymentRequest(reference)
        xenditStatus = paymentRequest.status || 'PENDING'
        paymentData = paymentRequest
        console.log('[Check Status] Payment Request status:', xenditStatus)
      } else {
        // Otherwise check as Invoice
        console.log('[Check Status] Checking Invoice:', reference)
        const invoice = await xenditService.getInvoice(reference)
        xenditStatus = (invoice as any).status || 'PENDING'
        paymentData = invoice
        console.log('[Check Status] Invoice status:', xenditStatus)
      }
    } catch (xenditError: any) {
      console.error('[Check Status] Xendit API error:', xenditError.message)
      return NextResponse.json({
        status: 'PENDING',
        message: 'Unable to check payment status',
        error: xenditError.message
      })
    }

    // If payment is successful/settled, process it
    const successStatuses = ['SUCCEEDED', 'PAID', 'SETTLED', 'CAPTURED']
    
    if (successStatuses.includes(xenditStatus.toUpperCase())) {
      console.log('[Check Status] Payment confirmed! Processing transaction...')
      
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          metadata: {
            ...metadata,
            manualCheckAt: new Date().toISOString(),
            xenditStatus: xenditStatus,
            processedViaPolling: true
          }
        }
      })

      // Process membership if applicable
      // FIX: fallback to metadata.membershipId if transaction.membershipId is null
      const membershipId = transaction.membershipId || (metadata?.membershipId)
      if (transaction.type === 'MEMBERSHIP' && membershipId) {
        // Update transaction.membershipId if it was null
        if (!transaction.membershipId && membershipId) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { membershipId }
          })
        }
        await processSuccessfulMembership(transaction)
      }

      // Process course enrollment if applicable
      if (transaction.type === 'COURSE' && transaction.courseId) {
        await processSuccessfulCourse(transaction)
      }

      return NextResponse.json({
        status: 'SUCCESS',
        message: 'Payment confirmed and processed',
        paidAt: new Date(),
        xenditStatus
      })
    }

    // Return current status
    return NextResponse.json({
      status: 'PENDING',
      message: 'Payment not yet confirmed',
      xenditStatus
    })

  } catch (error: any) {
    console.error('[Check Status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Process successful membership purchase
 */
async function processSuccessfulMembership(transaction: any) {
  const membershipId = transaction.membershipId
  const userId = transaction.userId

  // Check if UserMembership already exists for THIS transaction
  const existingForThisTxn = await prisma.userMembership.findFirst({
    where: {
      userId: userId,
      transactionId: transaction.id,
    },
  })

  if (existingForThisTxn) {
    console.log('[Check Status] UserMembership already exists for this transaction')
    return
  }

  // Get membership details
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId }
  })

  if (!membership) {
    console.error('[Check Status] Membership not found:', membershipId)
    return
  }

  // Calculate end date
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
  }

  // Check if user already has UserMembership for this membershipId (maybe old/expired)
  const existingForThisMembership = await prisma.userMembership.findFirst({
    where: {
      userId: userId,
      membershipId: membershipId,
    },
  })

  if (existingForThisMembership) {
    // Update existing UserMembership instead of creating new
    await prisma.userMembership.update({
      where: { id: existingForThisMembership.id },
      data: {
        status: 'ACTIVE',
        isActive: true,
        activatedAt: now,
        startDate: now,
        endDate,
        price: transaction.amount,
        transactionId: transaction.id,
      },
    })
    console.log('[Check Status] ✅ Existing UserMembership updated:', existingForThisMembership.id)
  } else {
    // Deactivate ALL other active memberships
    await prisma.userMembership.updateMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      data: { 
        isActive: false,
        status: 'EXPIRED'
      }
    })

    // Create new UserMembership
    await prisma.userMembership.create({
      data: {
        id: `um_poll_${transaction.id}`,
        userId: userId,
        membershipId: membershipId,
        status: 'ACTIVE',
        isActive: true,
        activatedAt: now,
        startDate: now,
        endDate,
        price: transaction.amount,
        transactionId: transaction.id,
      },
    })
    console.log('[Check Status] ✅ New UserMembership created')
  }

  // Upgrade user role to MEMBER_PREMIUM (except ADMIN, FOUNDER, CO_FOUNDER, MENTOR)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const keepRoles = ['ADMIN', 'FOUNDER', 'CO_FOUNDER', 'MENTOR']
  
  if (user && !keepRoles.includes(user.role)) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'MEMBER_PREMIUM' }
    })
    console.log('[Check Status] ✅ User role upgraded to MEMBER_PREMIUM')
  }

  // Auto-join groups
  const membershipGroups = await prisma.membershipGroup.findMany({
    where: { membershipId }
  })

  for (const mg of membershipGroups) {
    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId: mg.groupId, userId }
    })
    
    if (!existingMember) {
      await prisma.groupMember.create({
        data: {
          id: `gm_poll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          groupId: mg.groupId,
          userId,
          role: 'MEMBER'
        }
      }).catch(() => {})
    }
  }

  // Auto-enroll courses
  const membershipCourses = await prisma.membershipCourse.findMany({
    where: { membershipId }
  })

  for (const mc of membershipCourses) {
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId: mc.courseId, userId }
    })
    
    if (!existingEnrollment) {
      await prisma.courseEnrollment.create({
        data: {
          id: `enroll_poll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          courseId: mc.courseId,
          userId,
          updatedAt: new Date()
        }
      }).catch(() => {})
    }
  }

  console.log('[Check Status] ✅ Membership activation complete')
}

/**
 * Process successful course purchase
 */
async function processSuccessfulCourse(transaction: any) {
  const courseId = transaction.courseId
  const userId = transaction.userId

  // Check if already enrolled
  const existingEnrollment = await prisma.courseEnrollment.findFirst({
    where: { courseId, userId }
  })

  if (existingEnrollment) {
    console.log('[Check Status] Course enrollment already exists')
    return
  }

  // Create enrollment
  await prisma.courseEnrollment.create({
    data: {
      id: `enroll_poll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      courseId,
      progress: 0,
      transactionId: transaction.id,
      updatedAt: new Date()
    }
  })

  console.log('[Check Status] ✅ Course enrollment created')
}
