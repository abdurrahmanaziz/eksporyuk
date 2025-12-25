import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/checkout/event
 * Create a transaction for event ticket purchase
 * 
 * Body: {
 *   eventId: string
 *   affiliateCode?: string
 *   couponCode?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId, affiliateCode, couponCode } = body

    // 1. Validate event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rsvps: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!event.isPublished) {
      return NextResponse.json(
        { error: 'Event is not published' },
        { status: 400 }
      )
    }

    // 2. Check if user already registered for this event
    if (event.rsvps.length > 0) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    // 3. Check event price
    const eventPrice = parseFloat(event.price?.toString() || '0')
    
    if (eventPrice <= 0) {
      return NextResponse.json(
        { error: 'This is a free event. Use register endpoint instead.' },
        { status: 400 }
      )
    }

    // 4. Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        whatsapp: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 5. Calculate discounts and final price
    let finalPrice = eventPrice
    let discountAmount = 0
    let appliedCoupon = null
    let affiliateId = null

    // Handle coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      })

      if (coupon && coupon.isActive) {
        const discountValue = parseFloat(coupon.discountValue.toString())
        
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (eventPrice * discountValue) / 100
        } else {
          discountAmount = discountValue
        }
        
        finalPrice = Math.max(0, eventPrice - discountAmount)
        appliedCoupon = coupon.id
      }
    }

    // Handle affiliate
    if (affiliateCode) {
      const affiliate = await prisma.user.findFirst({
        where: {
          AND: [
            { role: 'AFFILIATE' },
            { username: affiliateCode }
          ]
        },
        select: { id: true }
      })

      if (affiliate) {
        affiliateId = affiliate.id
      }
    }

    // 6. Generate invoice number and create transaction
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()
    const externalId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'EVENT',
        status: 'PENDING',
        eventId: eventId,
        invoiceNumber: invoiceNumber,
        amount: finalPrice > 0 ? finalPrice : 0,
        originalAmount: eventPrice,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.whatsapp,
        description: `Ticket for event: ${event.title}`,
        externalId: externalId,
        couponId: appliedCoupon,
        affiliateId: affiliateId,
        metadata: {
          eventTitle: event.title,
          eventDate: event.startDate,
          eventType: event.type,
          ticketQty: 1
        }
      }
    })

    // 7. If free after discount, auto-create RSVP and return
    if (finalPrice <= 0) {
      await prisma.eventRSVP.create({
        data: {
          eventId: eventId,
          userId: session.user.id,
          status: 'GOING',
          transactionId: transaction.id,
          isPaid: finalPrice === 0 && eventPrice > 0,
          paidAt: new Date()
        }
      })

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS', paidAt: new Date() }
      })

      // Send notification for free after discount
      await (await import('@/lib/services/notificationService')).notificationService.send({
        userId: session.user.id,
        type: 'EVENT_REGISTERED',
        title: '✅ Terdaftar untuk Event!',
        message: `Anda sudah terdaftar untuk event ${event.title}`,
        eventId: eventId,
        redirectUrl: `/events/${eventId}`,
        channels: ['pusher', 'onesignal', 'email'],
      })

      return NextResponse.json({
        status: 'FREE_AFTER_DISCOUNT',
        message: 'Anda sudah terdaftar untuk event ini!',
        eventId: eventId,
        transactionId: transaction.id
      })
    }

    // 8. Create Xendit invoice
    const invoicePayload = {
      external_id: externalId,
      amount: Math.round(finalPrice),
      payer_email: user.email,
      description: `Event Ticket: ${event.title}`,
      customer: {
        given_names: user.name,
        email: user.email,
        mobile_number: user.whatsapp
      }
    }

    const invoiceData = await xenditService.createInvoice(invoicePayload)

    // 9. Save payment URL
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentUrl: invoiceData.invoiceUrl,
        reference: invoiceData.id
      }
    })

    console.log(`[Event Checkout] Created invoice for event ${eventId}: ${invoiceData.id}`)

    return NextResponse.json({
      status: 'PENDING_PAYMENT',
      transactionId: transaction.id,
      paymentUrl: invoiceData.invoiceUrl,
      amount: finalPrice,
      eventId: eventId
    })

  } catch (error) {
    console.error('[Event Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}
